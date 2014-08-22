/*
* adapt-pageIncompletePrompt
* License - https://github.com/cgkineo/adapt_framework/blob/master/README.md
* Maintainers - Thomas Taylor <thomas.taylor@kineo.com>
*/
define(function(require) {

	var Adapt = require('coreJS/adapt');
	var Backbone = require('backbone');

	var allComponentsComplete = function() {

		if (Adapt.location._contentType !== "course") {
			var currentPageModel = Adapt.contentObjects.findWhere({
		        "_id": Adapt.location._currentId
		    });
		}

		var currentPageComponents = currentPageModel.findDescendants('components').where({'_isAvailable': true});

		var enabledProgressComponents = _.filter(currentPageComponents, function(component) {
			if (component.attributes._pageLevelProgress) {
				return component.attributes._pageLevelProgress._isEnabled;
			}
		});

		var completedProgressComponents = _.filter(enabledProgressComponents, function(component) {
			if (component.attributes._isComplete) {
				return component.attributes._isComplete;
			}
		});

		if (completedProgressComponents.length < enabledProgressComponents.length) {
			return false;
		} else {
			return true;
		}

	};

	var promptObject = {
		title: "Leaving so soon?",
		body: "It looks like you're trying to leave this page but you haven't completed all the learning yet. Are you sure you want to leave?",
		_prompts:[
		    {
		        promptText: "Yes",
		        _callbackEvent: "pageCompletion:leavePage",
		    },
		    {
		        promptText: "No",
		        _callbackEvent: "pageCompletion:stayOnPage"
		    }
		],
		_showIcon: true
	}

	Adapt.on('router:page', function() {

		Adapt.router.set('_canNavigate', false, {pluginName: '_pageCompletionCheck'});

	});

	Adapt.on('navigation:backButton', function() {

		if(!allComponentsComplete()) {
			Adapt.trigger('notify:prompt', promptObject);
		} else {
			Adapt.router.set('_canNavigate', true, {pluginName: '_pageIncompletePrompt'});
		}

	});

	Adapt.on("pageCompletion:leavePage", function() {

		Adapt.router.set('_canNavigate', true, {pluginName: '_pageIncompletePrompt'});
		Adapt.trigger('navigation:backButton');

	});

});