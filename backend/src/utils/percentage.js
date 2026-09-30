/**
 * Auto-calculate percentage from subject marks.
 * Only non-null marks are counted (average of provided marks).
 */

/**
 * Calculate 10th percentage from individual subject marks
 * 6 Subjects: Maths, Science, English, Social Science, Sanskrit, Gujarati (Total: 600)
 *
 * @param {Object} marks - subject marks object
 * @returns {number} calculated percentage (0 if no marks provided)
 */
export const calculateTenthPercentage = (marks) => {
  const subjects = [
    marks.mathsMarks,
    marks.scienceMarks,
    marks.englishMarks,
    marks.socialScienceMarks,
    marks.sanskritMarks,
    marks.gujaratiMarks,
  ];

  const validMarks = subjects.filter(
    (m) => m !== null && m !== undefined && !isNaN(m)
  );

  if (validMarks.length === 0) return 0;

  const sum = validMarks.reduce((acc, m) => acc + m, 0);
  return Math.round((sum / validMarks.length) * 100) / 100; // 2 decimal places
};

/**
 * Calculate 12th percentage from individual subject marks
 * Subjects: English, Physics, Maths, Chemistry, Computer
 *
 * @param {Object} marks - subject marks object
 * @returns {number|null} calculated percentage (null if no marks provided)
 */
export const calculateTwelfthPercentage = (marks) => {
  const subjects = [
    marks.twelfthEnglishMarks,
    marks.twelfthPhysicsMarks,
    marks.twelfthMathsMarks,
    marks.twelfthChemistryMarks,
    marks.twelfthComputerMarks,
  ];

  const validMarks = subjects.filter(
    (m) => m !== null && m !== undefined && !isNaN(m)
  );

  if (validMarks.length === 0) return null;

  const sum = validMarks.reduce((acc, m) => acc + m, 0);
  return Math.round((sum / validMarks.length) * 100) / 100;
};

/**
 * Calculate CPI (Cumulative Performance Index) from all semester SPIs
 * CPI = average of ALL entered SPIs
 *
 * @param {Array<{semester: number, spi: number}>} spis
 * @returns {number|null}
 */
export const calculateCpi = (spis) => {
  if (!spis || spis.length === 0) return null;

  const validSpis = spis.filter(
    (s) => s.spi !== null && s.spi !== undefined && !isNaN(s.spi)
  );

  if (validSpis.length === 0) return null;

  const sum = validSpis.reduce((acc, s) => acc + s.spi, 0);
  return Math.round((sum / validSpis.length) * 100) / 100;
};

/**
 * Calculate CGPA from semester 5 and 6 SPIs only
 * CGPA = average of sem 5 + sem 6 SPI
 *
 * @param {Array<{semester: number, spi: number}>} spis
 * @returns {number|null}
 */
export const calculateCgpa = (spis) => {
  if (!spis || spis.length === 0) return null;

  const sem5 = spis.find((s) => s.semester === 5);
  const sem6 = spis.find((s) => s.semester === 6);

  const validSpis = [sem5, sem6].filter(
    (s) => s && s.spi !== null && s.spi !== undefined && !isNaN(s.spi)
  );

  if (validSpis.length === 0) return null;

  const sum = validSpis.reduce((acc, s) => acc + s.spi, 0);
  return Math.round((sum / validSpis.length) * 100) / 100;
};
