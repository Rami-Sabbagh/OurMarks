import type { TextItem } from 'pdfjs-dist/types/display/api';
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
 * Filters and simplifes a list of items, based on how the design document specifies that.
 *
 * @param items The target text items.
 * @returns The text items filtered and simplifed.
 */
export function filterAndSimplifyTextItems(items: TextItem[]): SimpleTextItem[] {
	return items
		.filter(
			(item) => item.dir !== 'ttb' // Filter all items with 'ttb' direction
            && item.transform[1] === 0 && item.transform[2] === 0 // or with any skewing/rotation
            && item.str !== '' && item.transform[4] !== 0 && item.transform[5] !== 0 // or is empty or invisible
		)
		.map(simplifyTextItem);
}
