/**
 * Долоо хоног 14: Эцсийн кодын шалгалт
 * Week 14: Final Code Review Checklist
 */

const readline = require('readline');

const CHECKLIST = {
  'code_quality': [
    'Бүх хувьсагчдын нэр ойлгомжтой байна',
    'Давхардсан код байхгүй (DRY зарчим)',
    'Функцууд нэг зорилготой (Single Responsibility)',
    'Сэтгэгдэл зохих түвшинд бичигдсэн',
    'Кодын формат нийцтэй (ESLint, Prettier)'
  ],
  'security': [
    'SQL Injection сэргийлсэн (Mongoose parameterized queries)',
    'XSS аюулгүй болгосон (input sanitization, helmet)',
    'Нууц үг зөв хадгалагдсан (bcrypt)',
    'Хэрэглэгчийн оролт шалгагдсан (express-validator)',
    'JWT токен аюулгүй (хүчтэй secret, expiration)',
    'Rate limiting хэрэгжсэн',
    'CORS зөв тохируулагдсан'
  ],
  'performance': [
    'Датабазын query оновчтой (index, projection)',
    'Илүүдэл loop ашиглаагүй',
    'Pagination хэрэгжсэн',
    'Response хурдан (< 500ms)',
    'Error handling бүрэн'
  ],
  'testing': [
    'Unit тестүүд бичигдсэн',
    'Integration тестүүд бичигдсэн',
    'Test coverage > 70%',
    'Performance тестүүд ажиллана',
    'Security тестүүд ажиллана'
  ],
  'documentation': [
    'README.md бүрэн',
    'API баримтжуулалт',
    'Суулгах заавар тодорхой',
    'Environment variables тайлбарлагдсан',
    'Код дотор JSDoc comments'
  ],
  'deployment': [
    'CI/CD pipeline ажиллаж байна',
    'Production environment тохируулагдсан',
    'Environment variables аюулгүй хадгалагдсан',
    'Backup стратеги байна',
    'Monitoring тохируулагдсан'
  ]
};

async function runFinalCheck() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query) => new Promise(resolve => rl.question(query, resolve));

  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   ЭЦСИЙН КОДЫН ШАЛГАЛТ - B222270037   ║');
  console.log('║   Barter Platform Project             ║');
  console.log('╚════════════════════════════════════════╝\n');

  let totalChecks = 0;
  let passedChecks = 0;
  const failedItems = [];

  for (const [category, checks] of Object.entries(CHECKLIST)) {
    console.log(`\n📋 ${category.toUpperCase().replace('_', ' ')}:`);
    console.log('─'.repeat(50));

    for (const check of checks) {
      totalChecks++;
      const answer = await question(`  ${totalChecks}. ${check}\n     ✓ Хангасан уу? (т/y/н/n): `);
      
      if (answer.toLowerCase() === 'т' || answer.toLowerCase() === 'y') {
        passedChecks++;
        console.log('     ✅ Хангасан\n');
      } else {
        failedItems.push({ category, check });
        console.log('     ❌ АНХААР: Энэ шалгуур дутуу байна!\n');
      }
    }
  }

  // Дүгнэлт
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║           ЭЦСИЙН ДҮГНЭЛТ              ║');
  console.log('╚════════════════════════════════════════╝\n');

  const percentage = (passedChecks / totalChecks * 100).toFixed(1);
  console.log(`Үр дүн: ${passedChecks}/${totalChecks} шалгалт өнгөрсөн (${percentage}%)\n`);

  if (failedItems.length > 0) {
    console.log('⚠️  ДУТУУ ЗҮЙЛС:\n');
    failedItems.forEach((item, index) => {
      console.log(`${index + 1}. [${item.category}] ${item.check}`);
    });
    console.log('');
  }

  if (percentage >= 90) {
    console.log('🎉 ТӨСӨЛ БЭЛЭН! Маш сайн түвшин!');
  } else if (percentage >= 80) {
    console.log('✅ ТӨСӨЛ БЭЛЭН! Сайн түвшин.');
    console.log('💡 Зөвлөмж: Дутуу зүйлсийг засах нь дээр.');
  } else if (percentage >= 70) {
    console.log('⚠️  ТӨСӨЛ ЕРӨНХИЙДӨӨ БЭЛЭН.');
    console.log('📝 Зөвлөмж: Дутуу зүйлсийг заавал засах хэрэгтэй!');
  } else {
    console.log('❌ ДАХИН ШАЛГАХ ШААРДЛАГАТАЙ!');
    console.log('🔧 Дутуу зүйлсийг засаад дахин шалгана уу.');
  }

  console.log('\n');
  rl.close();
}

// Export
module.exports = {
  CHECKLIST,
  runFinalCheck
};

// Командын мөрөөс ажиллуулах
if (require.main === module) {
  runFinalCheck()
    .then(() => {
      console.log('Шалгалт дууслаа.\n');
      process.exit(0);
    })
    .catch(error => {
      console.error('Алдаа гарлаа:', error.message);
      process.exit(1);
    });
}
