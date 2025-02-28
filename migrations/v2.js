import { describe, whereFromPlugin, mutateContent, checkContent, updatePlugin, getCourse } from 'adapt-migrations';
import _ from 'lodash';

describe('Page Incomplete Prompt - v2.0.2 to v2.0.3', async () => {
  let course, coursePIPGlobals;
  whereFromPlugin('Page Incomplete Prompt - from v2.0.2', { name: 'adapt-pageIncompletePrompt', version: '<2.0.3' });
  // mutateContent('Page Incomplete Prompt - add globals if missing', async (content) => {
  //   course = getCourse();
  //   if (!_.has(course, '_globals._extensions._pageIncompletePrompt')) _.set(course, '_globals._extensions._pageIncompletePrompt', {});
  //   coursePIPGlobals = course._globals._extensions._pageIncompletePrompt;
  //   return true;
  // });
  // mutateContent('Page Incomplete Prompt - add globals _navOrder', async (content) => {
  //   _.set(coursePIPGlobals, '_navOrder', 1);
  //   return true;
  // });
  // checkContent('Page Incomplete Prompt - check globals _navOrder attribute', async content => {
  //   if (coursePIPGlobals === undefined) throw new Error('Page Incomplete Prompt - globals _pageIncompletePrompt invalid');
  //   return true;
  // });
  // checkContent('Page Incomplete Prompt - check globals _navOrder attribute', async content => {
  //   if (coursePIPGlobals._navOrder !== 1) throw new Error('Page Incomplete Prompt - globals _navOrder invalid');
  //   return true;
  // });
  updatePlugin('Page Incomplete Prompt - update to v2.0.3', { name: 'adapt-pageIncompletePrompt', version: '2.0.3', framework: '^2.0.0' });
});
