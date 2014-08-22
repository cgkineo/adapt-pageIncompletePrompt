/*
* adapt-pageIncompletePrompt
* License - https://github.com/cgkineo/adapt_framework/blob/master/README.md
* Maintainers - Thomas Taylor <thomas.taylor@kineo.com>
*/
define(function(require) {
	var Adapt = require("coreJS/adapt");
	var PLUGIN_NAME = "_pageIncompletePrompt";

	var allComponentsComplete = function() {
		var pageModel = Adapt.findById(Adapt.location._currentId);
		var pageComponents = pageModel.findDescendants("components").where({"_isAvailable": true});
		var allComplete = true;
		
		_.each(pageComponents, function(component) {
			var pageProgress = component.attributes._pageLevelProgress;
			var isComplete = component.attributes._isComplete;
			if(pageProgress && pageProgress._isEnabled && !isComplete) allComplete = false;
		}, this);
		
		return allComplete;
	};
	
	var enableRouterNav = function(value) {
		Adapt.router.set("_canNavigate", value, {pluginName: PLUGIN_NAME});
	};	
	
	Adapt.on("router:page", function() {
		enableRouterNav(false);
	});
	
	Adapt.on("navigation:backButton", function() {
		if(!allComponentsComplete()) {	
			var model = Adapt.course.get(PLUGIN_NAME);
			var promptObject = {
				title: model.title,
				body: model.message,
				_prompts:[
					{
						promptText: model._buttons.yes,
						_callbackEvent: "pageIncompletePrompt:leavePage",
					},
					{
						promptText: model._buttons.no,
						_callbackEvent: ""
					}
				],
				_showIcon: true
			}
		
			Adapt.trigger("notify:prompt", promptObject);
		}
		else enableRouterNav(true);
	});
	
	Adapt.on("pageIncompletePrompt:leavePage", function() {
		enableRouterNav(true);
		Adapt.trigger("navigation:backButton");
	});
});