import Adapt from 'core/js/adapt';
import data from 'core/js/data';
import device from 'core/js/device';
import location from 'core/js/location';
import router from 'core/js/router';

class PageIncompletePrompt extends Backbone.Controller {
  initialize() {
    this.setupEventListeners();

    this.handleRoute = true;
    this.inPage = false;
    this.inPopup = false;
    this.isChangingLanguage = false;
    this.pageModel = null;
    this.model = null;
    this._ignoreAccessibilityNavigation = false;
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

    this.listenToOnce(Adapt, 'app:dataLoaded', function() {
      this.setupModel();
      this.listenTo(Adapt, 'accessibility:toggle', this.onAccessibilityToggle);
    });
  }

  /**
   * suppresses the prompt if the user changes language whilst in a page, then re-enables
   * it once the language has been changed and we've navigated back to a page
   */
  onLanguageChanging() {
    this.isChangingLanguage = true;

    this.setupModel();

    Adapt.once('router:page', function() {
      this.isChangingLanguage = false;
    }.bind(this));
  }

  setupModel() {
    this.model = Adapt.course.get(this._pageIncompletePrompt);
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
      // exit if on same page (e.g. if doing 'retry assessment')
      if (id === location._currentId) return;
      // check if routing to current page child
      const model = data.findById(id);
      const parent = model && model.findAncestor('contentObjects');
      if (parent && (parent.get('_id') === this.pageModel.get('_id'))) return;
    }

    if (this._ignoreAccessibilityNavigation) {
      this._ignoreAccessibilityNavigation = false;
      return;
    }

    this.enableRouterNavigation(false);
    this.showPrompt();
  }

  onAccessibilityToggle() {
    if (device.touch) {
      // accessibility is always on for touch devices
      // ignore toggle
      this._ignoreAccessibilityNavigation = false;
      return;
    }

    // skip renavigate for accessibility on desktop
    this._ignoreAccessibilityNavigation = true;
  }

  showPrompt() {
    // standard prompt settings (from course.json)
    const promptObject = {
      title: this.model.title,
      body: this.model.message,
      _classes: 'is-pageincompleteprompt ' + (this.model._classes || ''),
      _prompts: [{
        promptText: this.model._buttons.yes,
        _callbackEvent: 'pageIncompletePrompt:leavePage'
      }, {
        promptText: this.model._buttons.no,
        _callbackEvent: 'pageIncompletePrompt:cancel'
      }],
      _showIcon: true
    };

    // override with page-specific settings?
    const pipConfig = this.pageModel.get('_pageIncompletePrompt');
    if (pipConfig && pipConfig._buttons) {
      promptObject.title = pipConfig.title;
      promptObject.body = pipConfig.message;
      promptObject._classes = pipConfig._classes;
      promptObject._prompts[0].promptText = pipConfig._buttons.yes;
      promptObject._prompts[1].promptText = pipConfig._buttons.no;
    }

    this.listenToOnce(Adapt, 'notify:cancelled', this.onLeaveCancel);
    Adapt.trigger('notify:prompt', promptObject);
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

    const isEnabledForCourse = this.model && !!this.model._isEnabled;
    const isEnabledForPage = pageModel.get('_pageIncompletePrompt') && !!pageModel.get('_pageIncompletePrompt')._isEnabled;
    return (isEnabledForCourse && isEnabledForPage !== false) || isEnabledForPage;
  }

  enableRouterNavigation(value) {
    router.set('_canNavigate', value, { pluginName: this._pageIncompletePrompt });
  }

}

export default new PageIncompletePrompt();
