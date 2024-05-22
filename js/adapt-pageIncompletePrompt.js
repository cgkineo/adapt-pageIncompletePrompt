import Adapt from 'core/js/adapt';
import data from 'core/js/data';
import location from 'core/js/location';
import notify from 'core/js/notify';
import router from 'core/js/router';

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

    this.enableRouterNavigation(false);
    this.showPrompt();
  }

  showPrompt() {
    // Standard prompt settings (from course.json)
    const promptObject = {
      title: this.courseConfig.title,
      body: this.courseConfig.message,
      _classes: 'is-pageincompleteprompt ' + (this.courseConfig._classes || ''),
      _prompts: [{
        promptText: this.courseConfig._buttons.yes,
        _callbackEvent: 'pageIncompletePrompt:leavePage'
      }, {
        promptText: this.courseConfig._buttons.no,
        _callbackEvent: 'pageIncompletePrompt:cancel'
      }],
      _showIcon: true
    };

    // Override with page-specific settings
    const pipConfig = this.pageModel.get('_pageIncompletePrompt');
    if (pipConfig && pipConfig._buttons) {
      promptObject.title = pipConfig.title;
      promptObject.body = pipConfig.message;
      promptObject._classes = pipConfig._classes;
      promptObject._prompts[0].promptText = pipConfig._buttons.yes;
      promptObject._prompts[1].promptText = pipConfig._buttons.no;
    }

    this.listenToOnce(Adapt, 'notify:cancelled', this.onLeaveCancel);
    notify.prompt(promptObject);
    this.inPopup = true;
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

    const isEnabledForCourse = this.courseConfig && Boolean(this.courseConfig._isEnabled);
    const isEnabledForPage = pageModel.get('_pageIncompletePrompt') && !!pageModel.get('_pageIncompletePrompt')._isEnabled;
    return (isEnabledForCourse && isEnabledForPage !== false) || isEnabledForPage;
  }

  enableRouterNavigation(value) {
    router.model.set('_canNavigate', value, { pluginName: '_pageIncompletePrompt' });
  }
}

export default new PageIncompletePrompt();
