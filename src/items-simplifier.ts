import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import { SimpleTextItem } from './simple-text-item';

/**
 * Simplifies a single text item.
 *
 * @param item The target text item.
 * @returns The text item simplified.
 */
export function simplifyTextItem(item: TextItem): SimpleTextItem {
	return {
		value: item.str,
		arabic: item.dir === 'rtl' ? 'true' : 'false',
		x: item.transform[4],
		y: item.transform[5],
		width: item.width,
		height: item.height,
	};
}

/**
 * Filters and simplifies a list of items, based on how the design document specifies that.
 * - Splits the ligature "لا" or "لأ" into separate letters with adjusted positions.
 * - Handles diacritics by mapping them to 'ي' shifted left by 3 units.
 * - Post-processes sequences where the first letter is 'ا' and the second is one of [ي, ن, ت, ث, ئ, ب],
 *   swapping them if their x-distance is less than 0.04.
 *
 * @param items The target text items.
 * @returns The text items filtered, simplified, and adjusted.
 */
export function filterAndSimplifyTextItems(items: TextItem[]): SimpleTextItem[] {
	// Initial filter and split transforms
	const simplified = items
		.filter(
			(item) => item.dir !== 'ttb' // Filter vertical text
				&& item.transform[1] === 0 && item.transform[2] === 0 // No skew/rotation
				&& item.str !== '' && item.transform[4] !== 0 && item.transform[5] !== 0 // Visible
			// && item.str !== " "
		)
		.flatMap((item) => {
			// Arabic ligature handling
			if (item.str === 'لا' || item.str === 'لأ') {
				const base = simplifyTextItem(item);
				const first: SimpleTextItem = {
					...base,
					value: 'ل',
				};
				const second: SimpleTextItem = {
					...base,
					value: item.str === 'لا' ? 'ا' : 'أ',
					x: base.x - 3,
				};
				return [first, second];
			}

			// Diacritics mapping to 'ي'
			if (['ٌ', 'ً', 'ٍ'].includes(item.str)) {
				const base = simplifyTextItem(item);
				return [{
					...base,
					arabic: 'true',
					value: 'ي',
					x: base.x - 3,
				}];
			}
			if ([' '].includes(item.str)) {
				const base = simplifyTextItem(item);
				return [{
					...base,
					arabic: 'true',
				}];
			}
			// Default case
			return [simplifyTextItem(item)];
		});

	// Post-process: swap adjacent 'ا' + [ي, ن, ت, ث, ئ, ب] if too close
	for (let i = 0; i < simplified.length - 1; i++) {
		const curr = simplified[i];
		const next = simplified[i + 1];
		const swapLetters = ['ي', 'ن', 'ت', 'ث', 'ئ', 'ب'];
		if (
			curr.value === 'ا' &&
			swapLetters.includes(next.value) &&
			Math.abs(curr.x - next.x) < 0.5
		) {
			// Swap in place
			simplified[i] = { ...next, x: next.x + 0.5 };
			simplified[i + 1] = { ...curr };
			i++; // Skip next to avoid double processing
		}
	}
	return simplified;
}
