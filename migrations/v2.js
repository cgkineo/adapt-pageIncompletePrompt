import { describe, whereFromPlugin, whereContent, mutateContent, checkContent, updatePlugin, getCourse, testStopWhere, testSuccessWhere } from 'adapt-migrations';
import _ from 'lodash';

describe('Page Incomplete Prompt - v2.0.8 to v2.1.0', async () => {
  let course, coursePIP;
  whereFromPlugin('Page Incomplete Prompt - from v2.0.8', { name: 'adapt-pageIncompletePrompt', version: '<2.1.0' });
  whereContent('Page Incomplete Prompt - has course object', async content => {
    return content.some(item => item._type === 'course');
  });
  mutateContent('Page Incomplete Prompt - add course _pageIncompletePrompt._classes', async (content) => {
    course = getCourse();
    coursePIP = _.get(course, '_pageIncompletePrompt');

    if (!coursePIP) {
      coursePIP = {};
      _.set(course, '_pageIncompletePrompt', coursePIP);
    }

    if (!_.has(coursePIP, '_classes')) coursePIP._classes = '';

    return true;
  });
  checkContent('Page Incomplete Prompt - check course _pageIncompletePrompt._classes', async content => {
    if (!_.has(course, '_pageIncompletePrompt')) throw new Error('Page Incomplete Prompt - course _pageIncompletePrompt missing');
    if (!_.has(coursePIP, '_classes')) throw new Error('Page Incomplete Prompt - course _pageIncompletePrompt._classes invalid');
    return true;
  });
  updatePlugin('Page Incomplete Prompt - update to v2.1.0', { name: 'adapt-pageIncompletePrompt', version: '2.1.0', framework: '>=3.3' });

  testSuccessWhere('page incomplete prompt with empty course setting', {
    fromPlugins: [{ name: 'adapt-pageIncompletePrompt', version: '2.0.8' }],
    content: [
      { _id: 'c-100', _component: 'text' },
      { _type: 'course', _pageIncompletePrompt: {} }
    ]
  });

  testStopWhere('incorrect version', {
    fromPlugins: [{ name: 'adapt-pageIncompletePrompt', version: '2.1.0' }]
  });

  testStopWhere('missing course object', {
    fromPlugins: [{ name: 'adapt-pageIncompletePrompt', version: '2.0.8' }],
    content: [
      { _id: 'c-100', _component: 'text' }
    ]
  });

  testSuccessWhere('page incomplete prompt creates course settings', {
    fromPlugins: [{ name: 'adapt-pageIncompletePrompt', version: '2.0.8' }],
    content: [
      { _id: 'c-100', _component: 'text' },
      { _type: 'course' }
    ]
  });
});

describe('Page Incomplete Prompt - v2.1.0 to v2.2.1', async () => {
  let course, coursePIP;
  whereFromPlugin('Page Incomplete Prompt - from v2.1.0', { name: 'adapt-pageIncompletePrompt', version: '<2.2.1' });
  whereContent('Page Incomplete Prompt - has course _pageIncompletePrompt', async content => {
    return content.some(item => item._type === 'course' && item._pageIncompletePrompt);
  });
  // The v2.1.0 migration above creates _pageIncompletePrompt on every course,
  // including courses that never used the plugin, so only the display settings
  // are backfilled here. _isEnabled is deliberately left alone - defaulting it
  // would switch the prompt on for courses that never had it.
  mutateContent('Page Incomplete Prompt - backfill course _pageIncompletePrompt display settings', async (content) => {
    course = getCourse();
    coursePIP = _.get(course, '_pageIncompletePrompt');

    _.defaults(coursePIP, {
      title: 'Page incomplete',
      message: 'Are you sure you would like to leave?',
      _classes: ''
    });

    if (!_.has(coursePIP, '_buttons')) coursePIP._buttons = {};
    _.defaults(coursePIP._buttons, { yes: 'Yes', no: 'No' });

    return true;
  });
  checkContent('Page Incomplete Prompt - check course _pageIncompletePrompt display settings', async content => {
    if (!_.has(coursePIP, 'title')) throw new Error('Page Incomplete Prompt - course _pageIncompletePrompt.title missing');
    if (!_.has(coursePIP, 'message')) throw new Error('Page Incomplete Prompt - course _pageIncompletePrompt.message missing');
    if (!_.has(coursePIP, '_classes')) throw new Error('Page Incomplete Prompt - course _pageIncompletePrompt._classes missing');
    if (!_.has(coursePIP, '_buttons.yes')) throw new Error('Page Incomplete Prompt - course _pageIncompletePrompt._buttons.yes missing');
    if (!_.has(coursePIP, '_buttons.no')) throw new Error('Page Incomplete Prompt - course _pageIncompletePrompt._buttons.no missing');
    return true;
  });
  updatePlugin('Page Incomplete Prompt - update to v2.2.1', { name: 'adapt-pageIncompletePrompt', version: '2.2.1', framework: '>=5.19.1' });

  testSuccessWhere('page incomplete prompt missing buttons and copy', {
    fromPlugins: [{ name: 'adapt-pageIncompletePrompt', version: '2.1.0' }],
    content: [
      { _id: 'c-100', _component: 'text' },
      { _type: 'course', _pageIncompletePrompt: { _classes: '' } }
    ]
  });

  testSuccessWhere('page incomplete prompt already fully configured', {
    fromPlugins: [{ name: 'adapt-pageIncompletePrompt', version: '2.1.0' }],
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
    fromPlugins: [{ name: 'adapt-pageIncompletePrompt', version: '2.2.1' }]
  });

  testStopWhere('no course _pageIncompletePrompt', {
    fromPlugins: [{ name: 'adapt-pageIncompletePrompt', version: '2.1.0' }],
    content: [
      { _id: 'c-100', _component: 'text' },
      { _type: 'course' }
    ]
  });
});
