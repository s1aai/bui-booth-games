import type { Activity } from './data';

const MAX_APP = 12;
const MAX_ACTIVITY = 40;

/** Checks the apps and activities at startup. Returns one message per problem; empty means all fine. */
export function validateMfaContent(apps: readonly string[], activities: readonly Activity[]): string[] {
  const problems: string[] = [];
  // A wrong-app prompt needs a second app to name.
  if (apps.length < 3) problems.push(`There must be at least 3 apps (has ${apps.length}).`);
  if (new Set(apps).size !== apps.length) problems.push('Two apps have the same name.');
  for (const app of apps) {
    if (!app.trim() || app.length > MAX_APP) problems.push(`App "${app}": the name must be 1-${MAX_APP} characters.`);
  }
  if (activities.length < 3) problems.push(`There must be at least 3 activities (has ${activities.length}).`);
  for (const activity of activities) {
    if (!activity.text.trim() || activity.text.length > MAX_ACTIVITY) {
      problems.push(`Activity "${activity.text}": the text must be 1-${MAX_ACTIVITY} characters.`);
    }
  }
  return problems;
}
