/**
 * Represents a mark record extracted from the document.
 * 
 * All the fields (except the `studentId`) can be `null` because they might be missing from the table, or malformed with other values.
 */
export interface MarkRecord {
    /**
     * The exam ID of the student, a 5 digits number.
     */
    studentId: number,

    /**
     * The full name of the student, may contain his father's name in some situations.
     */
	studentName: string | null,
    /**
     * The name of the student's father when not included in the full name.
     */
	studentFatherName: string | null,

    /**
     * The practical mark of the exam, usually out of 20 or 30.
     */
	practicalMark: number | null,
    /**
     * The theoretical mark of the exam, usually out of 80 or 70.
     */
	theoreticalMark: number | null,

    /**
     * The total mark of the exam, should be out of 100.
     */
	examMark: number | null,
}