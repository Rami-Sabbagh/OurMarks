import { SimpleTextItem } from './simple-text-item';
import { MarkRecord, MarkRecord2 } from './mark-record';
import { type } from 'os';
function toWesternArabicDigits(input: string) {
	// console	
	const easternArabicDigits = "٠١٢٣٤٥٦٧٨٩";
	const westernArabicDigits = "0123456789";
	const output = input.replace(/[٠-٩]/g, d => westernArabicDigits[easternArabicDigits.indexOf(d)])
	return output;
}
function reverseString(str:string) {
  let reversed = '';
  for (let i = str.length - 1; i >= 0; i--) {
    reversed += str[i];
  }
  return reversed;
}


/**
 * Extracts metadata from a row of SimpleTextItems.
 * Searches for:
 * - "فصل" followed by semester word (أول، أول، الاول → 1; ثاني، الثاني → 2; others → 3)
 * - Year in format YYYY/YYYY
 * - "مقرر" then the rest of the text as subject
 * - "متقدمين" then digits as student count
 *
 * @param row Array of SimpleTextItems (each char may be separate)
 * @param info Object to populate with found metadata
 */
export function extractMetaInfo(
	row: readonly Readonly<SimpleTextItem>[],
	info: MetaInfo
): void {
	// Join each character by a dot

	const text = row.map(item => item.value).join('.');
	const raw = row.map(item => item.value).join('');
	// console.log(text);
	// Semester: فصل or الفصل with optional dots/spaces between letters and before semester word
	const semPattern = /(?:ف[.\s]?ص[.\s]?ل|ا[.\s]?ل[.\s]?ف[.\s]?ص[.\s]?ل)[.\s]*(?:ا[.\s]?و[.\s]?ل|أ[.\s]?و[.\s]?ل|ا[.\s]?ل[.\s]?ا[.\s]?و[.\s]?ل|ا[.\s]?ل[.\s]?أ[.\s]?و[.\s]?ل|ث[.\s]?ا[.\s]?ن[.\s]?ي|ا[.\s]?ل[.\s]?ث[.\s]?ا[.\s]?ن[.\s]?ي)/;
	const semMatch = text.match(semPattern);
	if (semMatch) {
		// Extract matched text, remove dots, spaces, and leading 'فصل'/'الفصل'
		let semWord = semMatch[0].replace(/[.\s]/g, '').replace(/^الفصل|^فصل/, '');
		// Remove leading 'ال' if present
		semWord = semWord.replace(/^ال/, '');
		if (["اول", "أول"].includes(semWord)) {
			info.semester = '1';
		} else if (["ثاني"].includes(semWord)) {
			info.semester = '2';
		} else {
			info.semester = '3';
		}
	}

	// Year: e.g. 2.0.2.3/2.0.2.4 → capture groups with digits and dots
 const yearPatterns = [
        /(\d{4})\\(\d{4})/,     // YYYY\YYYY
        /(\d{4})\/(\d{4})/,     // YYYY/YYYY
        /(\d{4})\s*-\s*(\d{4})/ // YYYY - YYYY
    ];
    for (const pattern of yearPatterns) {
        const match = raw.match(pattern);
        if (match) {
            const y1 = match[1];
            const y2 = match[2];
            info.year = `${y1[3]+y1[2]+y1[1]+y1[0]}/${y2[3]+y2[2]+y2[1]+y2[0]}`;
            break;
        }
    }

	// Subject: مقرر or المقرر with optional dots/spaces
	const subjPattern = /(?:م[.\s]?ق[.\s]?ر[.\s]?ر|ا[.\s]?ل[.\s]?م[.\s]?ق[.\s]?ر[.\s]?ر)(.+)/;
	const subjMatch = text.match(subjPattern);
	if (subjMatch) {
		info.subject = subjMatch[1].replace(/[.\s]/g, '');
	}

	// Students: متقدمين or المتقدمين followed by digits, with optional dots/spaces
	const studKeyword = /(?:م[.\s]?ت[.\s]?ق[.\s]?د[.\s]?م[.\s]?ي[.\s]?ن|ا[.\s]?ل[.\s]?م[.\s]?ت[.\s]?ق[.\s]?د[.\s]?م[.\s]?ي[.\s]?ن)/;
	if (studKeyword.test(text)) {
		const numMatch = raw.match(/\d+/g);
		if (numMatch) {
			info.students = reverseString(numMatch.join(''));
		}
	}
}
const THRESHOLD = 9.8;

/**
 * Extracts marks records from a table of simplified text items.
 *
 * @param itemsTable The simplified items table to extract marks from.
 * @returns The extracted marks records.
 */
export type MetaInfo = {
	semester: string | null
	year: string | null
	subject: string | null
	students: string | null
}
export function extractMarksFromItemsTable(itemsTable: readonly (readonly Readonly<SimpleTextItem>[])[], metaInfo: MetaInfo): MarkRecord2[] {
	const markRecords: MarkRecord2[] = [];
	for (const itemsRow of itemsTable) {
		extractMetaInfo(itemsRow, metaInfo);
		const studentIdItem: SimpleTextItem | undefined = itemsRow[0];
		let flag = false;
		// Check if it's a valid student ID, it should be a 5 digits number between 10000 and 59999.
		// Otherwise reject the whole row.
		if (!studentIdItem || studentIdItem.arabic !== 'false') {
			//console.table(itemsRow)
			// extractMetaInfo(itemsRow, metaInfo);
			continue
		}
		let numericId = toWesternArabicDigits(studentIdItem.value);

		if (!/^[1-5]\d{4}$/.test(numericId)) {
			if (itemsRow.length < 5) {
				//console.table(itemsRow);
				// extractMetaInfo(itemsRow, metaInfo);
				continue;
			}
			const digitItems = itemsRow.slice(0, 5); // [0] to [4]
			const digits: string[] = [];
			for (let i = 4; i >= 0; i--) {
				const cell = digitItems[i];
				if (!cell) break;

				const digit = toWesternArabicDigits(cell.value);
				if (!/^\d$/.test(digit)) break;

				digits.push(digit);
			}
			if (digits.length === 5) {
				const reconstructedId = digits.join(""); // [0]..[4]
				if (/^[1-5]\d{4}$/.test(reconstructedId)) {
					studentIdItem.value = reconstructedId;
					numericId = toWesternArabicDigits(studentIdItem.value);
					flag = true;
				}
			}
		};

		if (!numericId.match(/^[1-5]\d{4}$/)) {
			//console.table(itemsRow);
			// extractMetaInfo(itemsRow, metaInfo);
			continue
		}
		// console.log(flag ? `true ${numericId}` : `false${numericId}`)
		// Create the record.
		const record: MarkRecord2 = {
			studentId: Number.parseInt(numericId, 10),
			extractedStrings: [],
			practicalMark: null,
			theoreticalMark: null,
			examMark: null,
		};

		const marks: number[] = [];
		let lastX: number | null = null;
		let currentChunk = "";

		for (let i = 0; i < itemsRow.length; i++) {
			const item = itemsRow[i];
			// skip ID cell (and the reconstructed digits if `flag`)
			if (item === studentIdItem || (flag && i < 5)) continue;

			const { value, arabic, x } = item;
			const isArabic = arabic === 'true';
			const isMark = arabic === 'false' && /^\d{1,3}$/.test(value);

			//–– Text‐chunk logic ––
			if (isArabic && marks.length === 0) {
				const isBlankString = value.trim() === "";

				// if blank OR big X‐gap → flush old chunk
				if (
					isBlankString ||
					(lastX !== null && Math.abs(x - lastX) > THRESHOLD)
				) {
					if (currentChunk.trim()) {
						record.extractedStrings!.push(currentChunk.trim());
					}
					// start fresh with this cell’s text (unless it's blank)
					currentChunk = isBlankString ? "" : value.trim();
				} else {
					// same chunk — append with a space
					currentChunk += (currentChunk ? " " : "") + value.trim();
				}

				lastX = x;
			}

			//–– Numeric‐mark logic ––
			if (isMark) {
				marks.push(Number.parseInt(value, 10));
			}
		}

		// flush any leftover chunk
		if (currentChunk.trim()) {
			record.extractedStrings!.push(currentChunk.trim());
		}
		if (record.extractedStrings!.length === 0) {
			record.extractedStrings = null;
		}

		// assign marks as before
		if (marks.length === 3) {
			[record.practicalMark, record.theoreticalMark, record.examMark] = marks;
		} else if (marks.length > 0) {
			record.examMark = marks[marks.length - 1];
		}
		markRecords.push(record);
	}

	return markRecords;
}

