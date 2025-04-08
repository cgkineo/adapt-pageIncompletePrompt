import { describe, whereFromPlugin, mutateContent, checkContent, updatePlugin, getCourse, testStopWhere, testSuccessWhere } from 'adapt-migrations';

describe('Page Incomplete Prompt - v2.0.8 to v2.1.0', async () => {
  let course, coursePIP;
  whereFromPlugin('Page Incomplete Prompt - from v2.0.8', { name: 'adapt-pageIncompletePrompt', version: '<2.1.0' });
  mutateContent('Page Incomplete Prompt - add course _pageIncompletePrompt._classes', async (content) => {
    course = getCourse();
    coursePIP = course._pageIncompletePrompt;
    coursePIP._classes = '';
    return true;
  });
  checkContent('Page Incomplete Prompt - check course _pageIncompletePrompt._isHidden', async content => {
    if (coursePIP._classes === undefined) throw new Error('Page Incomplete Prompt - course _pageIncompletePrompt._classes invalid');
    return true;
  });
  updatePlugin('Page Incomplete Prompt - update to v2.1.0', { name: 'adapt-pageIncompletePrompt', version: '2.1.0', framework: '>=3.3' });

  testSuccessWhere('page incomplete prompt with empty course setting', {
    fromPlugins: [{ name: 'adapt-pageIncompletePrompt', version: '2.0.8' }],
    content: [
      { _id: 'c-100', _component: 'mcq' },
      { _type: 'course', _pageIncompletePrompt: {} }
    ]
  });

  testStopWhere('incorrect version', {
    fromPlugins: [{ name: 'adapt-pageIncompletePrompt', version: '2.1.0' }]
  });
});
