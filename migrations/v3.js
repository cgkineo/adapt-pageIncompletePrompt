import { describe, whereFromPlugin, whereContent, mutateContent, checkContent, updatePlugin, getCourse, testStopWhere, testSuccessWhere } from 'adapt-migrations';
import _ from 'lodash';

describe('Page Incomplete Prompt - v2.2.0 to v3.0.0', async () => {
  let course, coursePIP, originalPIP;
  whereFromPlugin('Page Incomplete Prompt - from v2.2.0', { name: 'adapt-pageIncompletePrompt', version: '<3.0.0' });
  whereContent('Page Incomplete Prompt - has course _pageIncompletePrompt', async content => {
    course = getCourse();
    coursePIP = course?._pageIncompletePrompt;
    if (!_.isPlainObject(coursePIP)) return false;
    originalPIP = _.cloneDeep(coursePIP);
    return true;
  });
  // The v2.1.0 migration creates _pageIncompletePrompt on every course,
  // including courses that never used the plugin, so only the display settings
  // are backfilled here. _isEnabled is deliberately left alone - defaulting it
  // would switch the prompt on for courses that never had it.
  mutateContent('Page Incomplete Prompt - backfill course _pageIncompletePrompt display settings', async (content) => {
    _.defaults(coursePIP, {
      title: 'Page incomplete',
      message: 'Are you sure you would like to leave?',
      _classes: ''
    });

    if (!_.isPlainObject(coursePIP._buttons)) coursePIP._buttons = {};
    _.defaults(coursePIP._buttons, { yes: 'Yes', no: 'No' });

    return true;
  });
  checkContent('Page Incomplete Prompt - check course _pageIncompletePrompt display settings', async content => {
    ['title', 'message', '_classes', '_buttons.yes', '_buttons.no'].forEach(path => {
      if (!_.has(coursePIP, path)) throw new Error(`Page Incomplete Prompt - course _pageIncompletePrompt.${path} missing`);
    });

    const isEnabledUnchanged = _.has(coursePIP, '_isEnabled') === _.has(originalPIP, '_isEnabled') &&
      coursePIP._isEnabled === originalPIP._isEnabled;
    if (!isEnabledUnchanged) throw new Error('Page Incomplete Prompt - course _pageIncompletePrompt._isEnabled was changed');

    const originalButtons = _.isPlainObject(originalPIP._buttons) ? originalPIP._buttons : {};
    const authored = {
      title: originalPIP.title,
      message: originalPIP.message,
      _classes: originalPIP._classes,
      '_buttons.yes': originalButtons.yes,
      '_buttons.no': originalButtons.no
    };
    _.forEach(authored, (value, path) => {
      if (value !== undefined && _.get(coursePIP, path) !== value) throw new Error(`Page Incomplete Prompt - course _pageIncompletePrompt.${path} was overwritten`);
    });

    return true;
  });
  updatePlugin('Page Incomplete Prompt - update to v3.0.0', { name: 'adapt-pageIncompletePrompt', version: '3.0.0', framework: '>=5.19.1' });

  testSuccessWhere('page incomplete prompt missing buttons and copy', {
    fromPlugins: [{ name: 'adapt-pageIncompletePrompt', version: '2.2.0' }],
    content: [
      { _id: 'c-100', _component: 'text' },
      { _type: 'course', _pageIncompletePrompt: { _classes: '' } }
    ]
  });

  testSuccessWhere('page incomplete prompt with empty course setting', {
    fromPlugins: [{ name: 'adapt-pageIncompletePrompt', version: '2.2.0' }],
    content: [
      { _id: 'c-100', _component: 'text' },
      { _type: 'course', _pageIncompletePrompt: {} }
    ]
  });

  testSuccessWhere('page incomplete prompt with one button label', {
    fromPlugins: [{ name: 'adapt-pageIncompletePrompt', version: '2.2.0' }],
    content: [
      { _id: 'c-100', _component: 'text' },
      { _type: 'course', _pageIncompletePrompt: { _isEnabled: false, _buttons: { yes: 'Leave' } } }
    ]
  });

  testSuccessWhere('page incomplete prompt with null buttons', {
    fromPlugins: [{ name: 'adapt-pageIncompletePrompt', version: '2.2.0' }],
    content: [
      { _id: 'c-100', _component: 'text' },
      { _type: 'course', _pageIncompletePrompt: { _buttons: null } }
    ]
  });

  testSuccessWhere('page incomplete prompt already fully configured', {
    fromPlugins: [{ name: 'adapt-pageIncompletePrompt', version: '2.2.0' }],
    content: [
      { _id: 'c-100', _component: 'text' },
      {
        _type: 'course',
        _pageIncompletePrompt: {
          _isEnabled: true,
          title: 'Hang on',
          message: 'Really leave?',
          _classes: 'custom-class',
          _buttons: { yes: 'Leave', no: 'Stay' }
        }
      }
    ]
  });

  testStopWhere('incorrect version', {
    fromPlugins: [{ name: 'adapt-pageIncompletePrompt', version: '3.0.0' }]
  });

  testStopWhere('no course _pageIncompletePrompt', {
    fromPlugins: [{ name: 'adapt-pageIncompletePrompt', version: '2.2.0' }],
    content: [
      { _id: 'c-100', _component: 'text' },
      { _type: 'course' }
    ]
  });

  testStopWhere('course _pageIncompletePrompt is not an object', {
    fromPlugins: [{ name: 'adapt-pageIncompletePrompt', version: '2.2.0' }],
    content: [
      { _id: 'c-100', _component: 'text' },
      { _type: 'course', _pageIncompletePrompt: true }
    ]
  });

  testStopWhere('missing course object', {
    fromPlugins: [{ name: 'adapt-pageIncompletePrompt', version: '2.2.0' }],
    content: [
      { _id: 'c-100', _component: 'text' }
    ]
  });
});
