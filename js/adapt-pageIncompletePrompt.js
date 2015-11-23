define([
    'coreJS/adapt'
], function(Adapt) {


    var PageIncompletePrompt = _.extend({
        
        PLUGIN_NAME: "_pageIncompletePrompt",

        handleRoute: true,
        inPage: false,
        inPopup: false,
        pageComponents: null,
        pageModel: null,
        routeArguments: null,
        model: null,

        _ignoreAccessibilityNavigation: false,

        initialize: function() {
            this.setupEventListeners();
        },

        setupEventListeners: function() {
            this.listenToOnce(Adapt, "app:dataLoaded", this.setupModel);
            this.listenTo(Adapt, "pageView:ready", this.onPageViewReady);
            this.listenTo(Adapt, "pageIncompletePrompt:leavePage", this.onLeavePage);
            this.listenTo(Adapt, "pageIncompletePrompt:cancel", this.onLeaveCancel);
            this.listenTo(Adapt, "router:navigate", this.onRouterNavigate);
            this.listenTo(Adapt, "accessibility:toggle", this.onAccessibilityToggle);
        },

        setupModel: function() {
            this.model = Adapt.course.get(this.PLUGIN_NAME);
        },

        onPageViewReady: function() {
            this.inPage = true;
            this.pageModel = Adapt.findById(Adapt.location._currentId);
            this.pageComponents = this.pageModel.findDescendants("components").where({"_isAvailable": true});
        },

        onLeavePage: function() {
            if (!this.inPopup) return;
            this.inPopup = false;

            this.enableRouterNavigation(true);
            this.handleRoute = false;
            this.inPage = false;

            Adapt.trigger("router:navigateTo", this.routeArguments);

            this.handleRoute = true;
        },

        onLeaveCancel: function() {
            if (!this.inPopup) return;
            this.routeArguments = undefined;
            this.enableRouterNavigation(true);
            this.handleRoute = true;
            this.inPopup = false;
        },

        onRouterNavigate: function(routeArguments) {
            if(!this.isEnabled() || this.allComponentsComplete()) return;

            if (routeArguments[0]) {
                //check if routing to current page child
                //exit if on same page
                try {
                    var id = routeArguments[0];
                    var model = Adapt.findById(id);
                    var parent = model.findAncestor("contentObjects");
                    if (parent.get("_id") == this.pageModel.get("_id")) return;
                } catch (e) {}
            }

            if (this._ignoreAccessibilityNavigation) {
                this._ignoreAccessibilityNavigation = false;
                return;
            }

            this.enableRouterNavigation(false)
            this.routeArguments = routeArguments;
            this.inPopup = true;
            
            var promptObject;
    		var pageIncompletePromptConfig = this.pageModel.get("_pageIncompletePrompt");
    		if (pageIncompletePromptConfig && pageIncompletePromptConfig._buttons) {
    			promptObject = {
    				title: pageIncompletePromptConfig.title,
    				body: pageIncompletePromptConfig.message,
    				_prompts:[{
    				        promptText: pageIncompletePromptConfig._buttons.yes,
    				        _callbackEvent: "pageIncompletePrompt:leavePage",
    				},{
    				        promptText: pageIncompletePromptConfig._buttons.no,
    				        _callbackEvent: "pageIncompletePrompt:cancel"
    				}],
    				_showIcon: true
    			};
    		} else {
    			promptObject = {
    				title: this.model.title,
    				body: this.model.message,
    				_prompts:[{
    				        promptText: this.model._buttons.yes,
    				        _callbackEvent: "pageIncompletePrompt:leavePage",
    				},{
    				        promptText: this.model._buttons.no,
    				        _callbackEvent: "pageIncompletePrompt:cancel"
    				}],
    				_showIcon: true
    			};
    		}

            this.listenToOnce(Adapt, "notify:closed", this.onLeaveCancel);

            Adapt.trigger("notify:prompt", promptObject);
        },

        onAccessibilityToggle: function() {
            this._ignoreAccessibilityNavigation = true;
        },

        isEnabled: function() {
            if (!Adapt.location._currentId) return false;
            if (!this.handleRoute) return false;
            if (!this.inPage) return false;
            if (this.inPopup) return;
            
            switch (Adapt.location._contentType) {
            case "menu": case "course":
                return false;
            }
            var pageModel = Adapt.findById(Adapt.location._currentId);
            if (pageModel.get("_isOptional")) return false;
            var isEnabledForCourse = this.model && !!this.model._isEnabled;
            var isEnabledForPage = pageModel.get("_pageIncompletePrompt") && !!pageModel.get("_pageIncompletePrompt")._isEnabled;               
            return (isEnabledForCourse && isEnabledForPage !== false) || isEnabledForPage;
        },

        allComponentsComplete: function() {
            var allComplete = true;
            
            _.each(this.pageComponents, function(component) {
                var hasPageProgress = component.get("_pageLevelProgress") && component.get("_pageLevelProgress")._isEnabled;
                var isComplete = component.get("_isComplete");
                if(hasPageProgress && !isComplete) allComplete = false;
            });
            
            return allComplete;
        },

        enableRouterNavigation: function(value) {
            Adapt.router.set("_canNavigate", value, { pluginName: this.PLUGIN_NAME });
        }

    }, Backbone.Events);

    PageIncompletePrompt.initialize();

    return PageIncompletePrompt;

});
