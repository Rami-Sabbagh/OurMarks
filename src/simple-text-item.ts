/**
 * A simplified version of raw text items, without any tranformations applied.
 */
export interface SimpleTextItem {
    /**
     * The content of the simplified item.
     */
    value: string,
    /**
     * Whether the item contains any Arabic characters or not.
     */
	arabic: 'true' | 'false',
    /**
     * The X coordinates of the item's bottom-left corner.
     */
	x: number,
    /**
     * The Y coordinates of the item's bottom-left corner.
     */
	y: number,
    /**
     * The width of the item.
     */
	width: number,
    /**
     * The height of the item.
     */
	height: number,
}
