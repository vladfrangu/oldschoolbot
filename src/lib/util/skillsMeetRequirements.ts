import { objectEntries } from 'e';

import { Skills } from '../types';

export function skillsMeetRequirements(skills: Skills, requirements: Skills) {
	for (const [skillName, level] of objectEntries(requirements)) {
		const has = skills[skillName];
		if (!has || has < level!) return false;
	}
	return true;
}
