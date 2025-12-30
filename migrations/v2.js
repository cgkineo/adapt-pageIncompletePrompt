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
