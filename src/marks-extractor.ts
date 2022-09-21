import { SimpleTextItem } from './simple-text-item';
import { MarkRecord } from './mark-record';

/**
 * Extracts marks records from a table of simplified text items.
 *
 * @param itemsTable The simplified items table to extract marks from.
 * @returns The extracted marks records.
 */
export function extractMarksFromItemsTable(itemsTable: readonly (readonly Readonly<SimpleTextItem>[])[]): MarkRecord[] {
	const markRecords: MarkRecord[] = [];

	for (const itemsRow of itemsTable) {
		const studentIdItem: SimpleTextItem | undefined = itemsRow[0];

		// Check if it's a valid student ID, it should be a 5 digits number between 10000 and 59999.
		// Otherwise reject the whole row.
		if (!studentIdItem || studentIdItem.arabic !== 'false' || !studentIdItem.value.match(/^[1-5]\d{4}$/)) continue;

		// Create the record.
		const record: MarkRecord = {
			studentId: Number.parseInt(studentIdItem.value, 10),
			studentName: null,
			studentFatherName: null,
			practicalMark: null,
			theoreticalMark: null,
			examMark: null,
		};

		const marks: number[] = [];

		for (const item of itemsRow) {
			if (item === studentIdItem) continue; // Ignore the student id.
			const { value, arabic } = item;

			const isMark = arabic === 'false' && value.match(/^\d{1,3}$/);
			const isArabic = arabic === 'true';

			if (isArabic && marks.length === 0) {
				if (record.studentName === null) record.studentName = value.trim();
				else if (record.studentFatherName === null) record.studentFatherName = value.trim();
				else record.studentName = `${record.studentName} ${record.studentFatherName}`, record.studentFatherName = value.trim();
			}

			if (isMark) marks.push(Number.parseInt(value, 10));
		}

		if (marks.length === 3)
			[record.practicalMark, record.theoreticalMark, record.examMark] = marks;
		else if (marks.length !== 0)
			record.examMark = marks[marks.length - 1];

		markRecords.push(record);
	}

	return markRecords;
}
