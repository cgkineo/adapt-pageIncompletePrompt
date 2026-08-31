import Adapt from 'core/js/adapt';
import data from 'core/js/data';
import location from 'core/js/location';
import notify from 'core/js/notify';
import router from 'core/js/router';

/**
 * Fallback prompt settings, mirroring the defaults declared in
 * schema/course.schema.json. Used when a course reaches runtime without a
 * complete `_pageIncompletePrompt` configuration.
 */
const DEFAULTS = {
  title: 'Page incomplete',
  message: 'Are you sure you would like to leave?',
  _classes: '',
  _buttons: {
    yes: 'Yes',
    no: 'No'
  }
};

class PageIncompletePrompt extends Backbone.Controller {
  initialize() {
    this.handleRoute = true;
    this.inPage = false;
    this.inPopup = false;
    this.isChangingLanguage = false;
    this.pageModel = null;
    this._ignoreAccessibilityNavigation = false;

    this.setupEventListeners();
  }

  setupEventListeners() {
    _.bindAll(this, 'onLanguageChanging', 'onPageViewReady', 'onLeavePage', 'onLeaveCancel', 'onRouterNavigate');

    this.listenTo(Adapt, {
      'app:languageChanged': this.onLanguageChanging,
      'pageView:ready': this.onPageViewReady,
      'pageIncompletePrompt:leavePage': this.onLeavePage,
      'pageIncompletePrompt:cancel': this.onLeaveCancel,
      'router:navigate': this.onRouterNavigate
    });
  }

  /**
   * Suppresses the prompt if the user changes language whilst in a page, then re-enables
   * it once the language has been changed and we have navigated back to a page.
   */
  onLanguageChanging() {
    this.isChangingLanguage = true;

    Adapt.once('router:page', () => {
      this.isChangingLanguage = false;
    });
  }

  get courseConfig() {
    return Adapt.course.get('_pageIncompletePrompt');
  }

  onPageViewReady() {
    this.inPage = true;
    this.pageModel = data.findById(location._currentId);
  }

  onLeavePage() {
    if (!this.inPopup) return;
    this.inPopup = false;

    this.stopListening(Adapt, 'notify:cancelled');
    this.enableRouterNavigation(true);
    this.handleRoute = false;
    this.inPage = false;

    window.location.href = this.href;

    this.handleRoute = true;
  }

  onLeaveCancel() {
    if (!this.inPopup) return;
    this.inPopup = false;

    this.stopListening(Adapt, 'notify:cancelled');
    this.enableRouterNavigation(true);
    this.handleRoute = true;
  }

  onRouterNavigate(routeArguments) {
    if (!this.isEnabled() || this.pageModel.get('_isComplete')) return;

    this.href = /#/.test(window.location.href) ?
      window.location.href :
      window.location.href + '#';

    const id = routeArguments[0];
    if (id) {
      // Exit if on same page (e.g. if doing 'retry assessment')
      if (id === location._currentId) return;

      // Check if routing to current page child
      const model = data.findById(id);
      const parent = model && model.findAncestor('contentObjects');
      if (parent && (parent.get('_id') === this.pageModel.get('_id'))) return;
    }

    this.showPrompt();
  }

  /**
   * Resolves the prompt settings from page-level overrides, course-level
   * settings and plugin defaults, in that order of precedence. Always returns
   * a complete prompt object, so navigation is never locked for a prompt that
   * cannot be built.
   * @returns {Object} A notify prompt configuration.
   */
  getPromptObject() {
    const courseConfig = this.courseConfig || {};
    const pageConfig = this.pageModel.get('_pageIncompletePrompt') || {};
    const buttons = { ...DEFAULTS._buttons, ...courseConfig._buttons, ...pageConfig._buttons };
    const classes = pageConfig._classes ?? courseConfig._classes ?? DEFAULTS._classes;

    return {
      title: pageConfig.title ?? courseConfig.title ?? DEFAULTS.title,
      body: pageConfig.message ?? courseConfig.message ?? DEFAULTS.message,
      _classes: `is-pageincompleteprompt ${classes}`.trim(),
      _prompts: [{
        promptText: buttons.yes,
        _callbackEvent: 'pageIncompletePrompt:leavePage'
      }, {
        promptText: buttons.no,
        _callbackEvent: 'pageIncompletePrompt:cancel'
      }],
      _showIcon: true
    };
  }

  showPrompt() {
    // Build the prompt before disabling navigation, so a failure here can never
    // leave the router locked with no prompt on screen.
    const promptObject = this.getPromptObject();

    this.enableRouterNavigation(false);

    try {
      this.listenToOnce(Adapt, 'notify:cancelled', this.onLeaveCancel);
      notify.prompt(promptObject);
      this.inPopup = true;
    } catch (error) {
      this.stopListening(Adapt, 'notify:cancelled');
      this.enableRouterNavigation(true);
      throw error;
    }
  }

  isEnabled() {
    if (!location._currentId) return false;
    if (!this.handleRoute) return false;
    if (!this.inPage) return false;
    if (this.inPopup) return false;
    if (this.isChangingLanguage) return false;

    switch (location._contentType) {
      case 'menu': case 'course':
        this.inPage = false;
        return false;
    }

    const pageModel = data.findById(location._currentId);
    if (pageModel.get('_isOptional')) return false;

    // A page-level _isEnabled is an explicit override; an absent one inherits the
    // course setting. Uses `??` rather than `||` so an explicit false still wins,
    // and avoids coercing an absent value to false - which would make a page
    // config of `{}` read as "disabled" instead of "inherit".
    const pageOverride = pageModel.get('_pageIncompletePrompt')?._isEnabled;
    return pageOverride ?? Boolean(this.courseConfig?._isEnabled);
  }

  enableRouterNavigation(value) {
    router.model.set('_canNavigate', value, { pluginName: '_pageIncompletePrompt' });
  }
}

export default new PageIncompletePrompt();
