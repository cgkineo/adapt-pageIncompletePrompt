import { describe, whereFromPlugin, mutateContent, checkContent, updatePlugin, getCourse } from 'adapt-migrations';
import _ from 'lodash';

describe('Page Incomplete Prompt - v2.0.8 to v2.1.0', async () => {
  let course, coursePIP;
  whereFromPlugin('Page Incomplete Prompt - from v2.0.8', { name: 'adapt-pageIncompletePrompt', version: '<2.1.0' });
  mutateContent('Page Incomplete Prompt - add course _pageIncompletePrompt._classes', async (content) => {
    course = getCourse();
    if (!_.has(course, '_pageIncompletePrompt')) _.set(course, '_pageIncompletePrompt', {});
    coursePIP = course._pageIncompletePrompt;
    coursePIP._classes = '';
    return true;
  });
  checkContent('Page Incomplete Prompt - check course _pageIncompletePrompt object', async content => {
    if (coursePIP === undefined) throw new Error('Page Incomplete Prompt - course _pageIncompletePrompt invalid');
    return true;
  });
  checkContent('Page Incomplete Prompt - check course _pageIncompletePrompt._isHidden', async content => {
    if (coursePIP._classes === undefined) throw new Error('Page Incomplete Prompt - course _pageIncompletePrompt._classes invalid');
    return true;
  });
  updatePlugin('Page Incomplete Prompt - update to v2.1.0', { name: 'adapt-pageIncompletePrompt', version: '2.1.0', framework: '>=3.3' });
});
