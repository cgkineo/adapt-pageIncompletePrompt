import Adapt from 'core/js/adapt';
import data from 'core/js/data';
import location from 'core/js/location';
import logging from 'core/js/logging';
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

    this.showPrompt();
  }

  /**
   * Builds the prompt from the course-level settings. Returns null when either
   * button label is missing, as the learner could not answer the prompt.
   * @returns {Object|null} The argument for `notify.prompt()`, or null.
   */
  getPromptObject() {
    const { title, message, _classes, _buttons } = this.courseConfig ?? {};
    if (!_buttons?.yes || !_buttons?.no) return null;

    return {
      title,
      body: message,
      _classes: `is-pageincompleteprompt ${_classes ?? ''}`.trim(),
      _prompts: [{
        promptText: _buttons.yes,
        _callbackEvent: 'pageIncompletePrompt:leavePage'
      }, {
        promptText: _buttons.no,
        _callbackEvent: 'pageIncompletePrompt:cancel'
      }],
      _showIcon: true
    };
  }

  /**
   * Shows the prompt and locks navigation until the learner answers it. If the
   * prompt cannot be built or rendered, logs why and leaves navigation
   * unlocked, so the route continues without a prompt.
   */
  showPrompt() {
    // Build the prompt before disabling navigation, so a course that cannot
    // show one never leaves the router locked with no prompt on screen.
    const promptObject = this.getPromptObject();
    if (!promptObject) {
      logging.warnOnce('PageIncompletePrompt: course _pageIncompletePrompt._buttons.yes and _buttons.no must be set; no prompt shown');
      return;
    }

    this.enableRouterNavigation(false);

    try {
      this.listenToOnce(Adapt, 'notify:cancelled', this.onLeaveCancel);
      notify.prompt(promptObject);
      this.inPopup = true;
    } catch (error) {
      // Not rethrown: an error escaping 'router:navigate' would skip the router's
      // own cancel path and leave the URL changed with the old page on screen.
      this.stopListening(Adapt, 'notify:cancelled');
      this.enableRouterNavigation(true);
      logging.error('PageIncompletePrompt: prompt could not be shown', error);
    }
  }

  /**
   * Whether leaving the current page should show the prompt. A page-level
   * `_isEnabled` overrides the course setting; when absent, the page inherits it.
   * @returns {boolean}
   */
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

    // `??` so an explicit page false still wins over an enabled course
    const pageOverride = pageModel.get('_pageIncompletePrompt')?._isEnabled;
    return Boolean(pageOverride ?? this.courseConfig?._isEnabled);
  }

  enableRouterNavigation(value) {
    router.model.set('_canNavigate', value, { pluginName: '_pageIncompletePrompt' });
  }
}

export default new PageIncompletePrompt();
