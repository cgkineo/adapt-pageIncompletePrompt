define([
    'core/js/adapt'
], function(Adapt) {

    var PageIncompletePrompt = _.extend({
        
        PLUGIN_NAME: "_pageIncompletePrompt",

        handleRoute: true,
        inPage: false,
        inPopup: false,
        pageComponents: null,
        pageModel: null,
        model: null,

        _ignoreAccessibilityNavigation: false,

        initialize: function() {
            this.setupEventListeners();
        },

        setupEventListeners: function() {
            this.listenToOnce(Adapt, "app:dataLoaded", this.setupModel);
            this.listenTo(Adapt, {
                "pageView:ready": this.onPageViewReady,
                "pageIncompletePrompt:leavePage": this.onLeavePage,
                "pageIncompletePrompt:cancel": this.onLeaveCancel,
                "router:navigate": this.onRouterNavigate
            });
        },

        setupModel: function() {
            this.model = Adapt.course.get(this.PLUGIN_NAME);
            this.listenTo(Adapt, "accessibility:toggle", this.onAccessibilityToggle);
        },

        onPageViewReady: function() {
            this.inPage = true;
            this.pageModel = Adapt.findById(Adapt.location._currentId);
            this.pageComponents = _.filter(this.pageModel.findDescendantModels("components"), function(item) {
                return item.get("_isAvailable") === true;
            });
        },

        onLeavePage: function() {
            if (!this.inPopup) return;
            this.inPopup = false;

            this.stopListening(Adapt, "notify:cancelled");
            this.enableRouterNavigation(true);
            this.handleRoute = false;
            this.inPage = false;

            window.location.href = this.href;

            this.handleRoute = true;
        },

        onLeaveCancel: function() {
            if (!this.inPopup) return;
            this.inPopup = false;
            
            this.stopListening(Adapt, "notify:cancelled");
            this.enableRouterNavigation(true);
            this.handleRoute = true;
        },

        onRouterNavigate: function(routeArguments) {
            
            if(!this.isEnabled() || this.allComponentsComplete()) return;

            this.href = window.location.href;

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

            this.enableRouterNavigation(false);

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

            this.listenToOnce(Adapt, "notify:cancelled", this.onLeaveCancel);

            Adapt.trigger("notify:prompt", promptObject);
        },

        onAccessibilityToggle: function() {
            if (Adapt.device.touch) {
                //accessibility is always on for touch devices
                //ignore toggle
                this._ignoreAccessibilityNavigation = false;
            } else {
                //skip renavigate for accessibility on desktop
                this._ignoreAccessibilityNavigation = true;
            }
        },

        isEnabled: function() {
            if (!Adapt.location._currentId) return false;
            if (!this.handleRoute) return false;
            if (!this.inPage) return false;
            if (this.inPopup) return false;
            
            switch (Adapt.location._contentType) {
            case "menu": case "course":
                this.inPage = false;
                return false;
            }
            var pageModel = Adapt.findById(Adapt.location._currentId);
            if (pageModel.get("_isOptional")) return false;
            var isEnabledForCourse = this.model && !!this.model._isEnabled;
            var isEnabledForPage = pageModel.get("_pageIncompletePrompt") && !!pageModel.get("_pageIncompletePrompt")._isEnabled;               
            return (isEnabledForCourse && isEnabledForPage !== false) || isEnabledForPage;
        },

        allComponentsComplete: function() {
            
            if(this.pageComponents === null) return true;
            
            for(var i = 0, count = this.pageComponents.length; i < count; i++) {
                var component  = this.pageComponents[i];
                var isMandatory = (component.get('_isOptional') === false);
                var isComplete = component.get("_isComplete");
            
                if(isMandatory && !isComplete) return false;   
            }
            
            return true;
        },

        enableRouterNavigation: function(value) {
            Adapt.router.set("_canNavigate", value, { pluginName: this.PLUGIN_NAME });
        }

    }, Backbone.Events);

    PageIncompletePrompt.initialize();

    return PageIncompletePrompt;

});
