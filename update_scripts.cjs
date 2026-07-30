const fs = require('fs');
const path = require('path');

const map = {
  'CourseAndResults.jsx': 'courseAndResults',
  'AcademicRegistration.jsx': 'registration',
  'RegistrationPrint.jsx': 'registration',
  'HomeRegistration.jsx': 'registration',
  'ExamRoutine.jsx': 'examRoutine',
  'MkCurriculumn.jsx': 'curriculum',
  'Financials.jsx': 'financials',
  'DropApplication.jsx': 'dropApplication',
  'by_carriculum.jsx': 'gradeReport',
  'by_semester.jsx': 'gradeReport',
  'ChangePassword.jsx': 'profile',
  'ProfileContent.jsx': 'profile',
  'OnlinePaymentHistory.jsx': 'paymentHistory',
  'SectionDetails.jsx': 'generalUI',
  'Intro.jsx': 'generalUI',
  'ClassSchedule.jsx': 'generalUI',
  'Sidebar.jsx': 'generalUI',
  'Navbar.jsx': 'generalUI'
};

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      results = results.concat(walkDir(fullPath));
    } else if (file.endsWith('.jsx')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = walkDir('./src/components');

files.forEach(file => {
  const basename = path.basename(file);
  const feature = map[basename];
  if (!feature) return;

  let content = fs.readFileSync(file, 'utf8');

  // Attempt 1: Standard match
  const targetRegex1 = /chrome\.storage\.sync\.get\(\{\s*extensionEnabled:\s*true\s*\},?\s*\((r|res|result)\)\s*=>\s*\{\s*if\s*\(!\1\.extensionEnabled\)\s*return;/g;
  
  if (targetRegex1.test(content)) {
    content = content.replace(targetRegex1, (match, p1) => {
      return `chrome.storage.sync.get({ extensionEnabled: true, featureToggles: {} }, (${p1}) => {\n    if (!${p1}.extensionEnabled || ${p1}.featureToggles?.['${feature}'] === false) return;`;
    });
    fs.writeFileSync(file, content);
    console.log(`Updated ${basename}`);
  } else {
    console.log(`Pattern not found in ${basename}`);
  }
});
