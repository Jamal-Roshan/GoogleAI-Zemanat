import { LetterTemplate, PlaceholderInfo } from '../types';

export const SYSTEM_PLACEHOLDERS: PlaceholderInfo[] = [
  { tag: '{OrgTitle}', label: 'عنوان سازمان', category: 'org', example: 'سازمان مدیریت و برنامه‌ریزی' },
  { tag: '{ManagingUnit}', label: 'واحد متولی', category: 'org', example: 'اداره کل امور اداری و رفاه' },
  { tag: '{OrgAddress}', label: 'نشانی سازمان', category: 'org', example: 'تهران، میدان بهارستان' },
  { tag: '{OrgPhone}', label: 'تلفن سازمان', category: 'org', example: '۰۲۱-۳۳۲۲۱۱۰۰' },
  { tag: '{SignerName}', label: 'نام امضاکننده', category: 'org', example: 'دکتر محمدرضا صادقی' },
  { tag: '{SignerRole}', label: 'سمت امضاکننده', category: 'org', example: 'مدیرکل امور اداری و پشتیبانی' },

  { tag: '{CertificateNo}', label: 'شماره رسمی دبیرخانه (مثلاً 1/104)', category: 'system', example: '۱/۱۰۴' },
  { tag: '{TrackingCode}', label: 'کد رهگیری سیستمی', category: 'system', example: 'TRK-98421' },
  { tag: '{Date}', label: 'تاریخ صدور نامه', category: 'system', example: '۱۴۰۳/۰۸/۲۰' },

  { tag: '{FullName}', label: 'نام و نام خانوادگی کارمند', category: 'personnel', example: 'علی حسینی فرد' },
  { tag: '{FatherName}', label: 'نام پدر', category: 'personnel', example: 'محمد' },
  { tag: '{NationalCode}', label: 'کد ملی', category: 'personnel', example: '۰۰۱۲۳۴۵۶۷۸' },
  { tag: '{PersonnelCode}', label: 'کد پرسنلی', category: 'personnel', example: '۸۹۱۲۰۴' },
  { tag: '{EmploymentType}', label: 'نوع استخدام', category: 'personnel', example: 'رسمی قطعی' },
  { tag: '{Department}', label: 'واحد سازمانی / محل خدمت', category: 'personnel', example: 'معاونت فنی و فناوری اطلاعات' },
  { tag: '{JobTitle}', label: 'عنوان شغلی', category: 'personnel', example: 'کارشناس ارشد شبکه' },
  { tag: '{NetSalary}', label: 'خالص دریافتی ماهانه', category: 'personnel', example: '۳۲۰,۰۰۰,۰۰۰ ریال' },
  { tag: '{NetSalaryWords}', label: 'خالص دریافتی به حروف', category: 'personnel', example: 'سیصد و بیست میلیون ریال' },

  { tag: '{BankName}', label: 'نام بانک تسهیلات‌دهنده', category: 'bank', example: 'بانک ملی ایران' },
  { tag: '{BranchName}', label: 'نام شعبه بانک', category: 'bank', example: 'شعبه مرکزی' },
  { tag: '{BankLetterNo}', label: 'شماره نامه استعلام بانک', category: 'bank', example: '۹۸۴/ص/۱۲' },
  { tag: '{BankLetterDate}', label: 'تاریخ نامه استعلام بانک', category: 'bank', example: '۱۴۰۳/۰۸/۱۵' },

  { tag: '{LoanAmount}', label: 'مبلغ کل وام / تسهیلات', category: 'loan', example: '۵۰۰,۰۰۰,۰۰۰ ریال' },
  { tag: '{LoanAmountWords}', label: 'مبلغ تسهیلات به حروف', category: 'loan', example: 'پانصد میلیون ریال' },
  { tag: '{BorrowerName}', label: 'نام وام‌گیرنده', category: 'loan', example: 'علی حسینی فرد' },
  { tag: '{BorrowerNationalCode}', label: 'کد ملی وام‌گیرنده', category: 'loan', example: '۰۰۱۲۳۴۵۶۷۸' },
  { tag: '{BorrowerFatherName}', label: 'نام پدر وام‌گیرنده', category: 'loan', example: 'حسین' },
  { tag: '{BorrowerRelation}', label: 'نسبت با متقاضی', category: 'loan', example: 'خود پرسنل' },
];

export const DEFAULT_TEMPLATES: LetterTemplate[] = [
  {
    id: 'tpl_govahie',
    type: 'salary_deduction',
    title: 'قالب رسمی گواهی حقوقی و کسر از حقوق',
    description: 'تمپلیت رسمی گواهی کسر از حقوق شامل وکالت‌نامه متقاضی و تعهد رسمی اداره با ۵ شرط قانونی',
    isDefault: true,
    lastUpdated: '۱۴۰۳/۰۸/۲۰',
    content: `[بخش تقاضا و وکالت‌نامه متقاضی]
با سلام و احترام
اینجانب {FullName} نام پدر {FatherName} با کد ملی {NationalCode} کارمند {EmploymentType} آن اداره با کد پرسنلی {PersonnelCode} نام محل خدمت (برای شاغلین) {Department} متقاضی دریافت وام از {BankName} به مبلغ {LoanAmount} ریال ({LoanAmountWords}) می‌باشم. و ضمن عقد خارج لازم به آن اداره محترم، وکالت بلاعزل می‌دهم چنانچه به هر دلیل اقساط وام مزبور پرداخت نگردد، اقساط معوقه ماهیانه همراه با تمامی هزینه‌های پستی و... به هر میزان که باشد از حقوق و مزایای اینجانب کسر و به حساب مربوطه واریز گردد.

--------------------------------------------------
[بخش تعهد بازپرداخت و گواهی رسمی اداره به بانک]
رئیس محترم {BankName} - {BranchName}
با سلام و احترام
گواهی می‌شود {FullName} نام پدر {FatherName} و کد ملی {NationalCode} همکار {EmploymentType} با کد پرسنلی {PersonnelCode} این اداره متقاضی دریافت وام تا مبلغ {LoanAmount} ریال ({LoanAmountWords}) می‌باشد و براساس آخرین وضعیت حقوقی، نامبرده ماهیانه مبلغ {NetSalary} ریال ({NetSalaryWords}) حقوق و مزایا دریافت می‌نماید. بدیهی است این اداره در صورت تعویق اقساط وام، با شرایط زیر و طی مراحل اجرایی توسط آن بانک یا موسسه مالی اقدام خواهد نمود:

۱- این تعهد فقط تا زمانی که متقاضی در قید حیات بوده و از این اداره حقوق و مزایا دریافت می‌کند معتبر بوده و در غیر این صورت این اداره تعهدی نخواهد داشت.
۲- گواهی حقوقی و ضمانت‌نامه فقط جهت همکاران شاغل و بازنشسته رسمی یا پیمانی صادر گردیده و برای بانک‌ها و موسسات مالی دولتی و خصوصی دارای مجوز از بانک مرکزی معتبر است.
۳- این اداره در صورت تعویق اقساط وام منوط به رعایت موارد مذکور طبق قانون اجرای احکام مدنی حداکثر تا یک چهارم در صورت تاهل و یک سوم در صورت تجرد از حقوق و مزایای متعهد کسر می‌نماید.
۴- این تعهدنامه بنا به درخواست نامبرده صادر گردیده و تایید اصالت آن منوط به استعلام کتبی از طرف بانک یا موسسه مالی خواهد بود.
۵- این تعهدنامه در تاریخ {Date} صادر گردیده و تا ۳۰ روز جهت ارائه به بانک یا موسسه مالی اعتبار دارد.`,
  },
  {
    id: 'tpl_zemanatnameh',
    type: 'bank_guarantee',
    title: 'قالب رسمی ضمانت‌نامه بانکی کارمندی',
    description: 'تمپلیت رسمی ضمانت‌نامه بانکی شامل وکالت‌نامه ضامن و تعهد ضمانت رسمی اداره با شرایط ۵ گانه',
    isDefault: true,
    lastUpdated: '۱۴۰۳/۰۸/۲۰',
    content: `[بخش تقاضا و وکالت‌نامه کارمند ضامن]
با سلام و احترام
اینجانب {FullName} نام پدر {FatherName} با کد ملی {NationalCode} کارمند {EmploymentType} آن اداره با کد پرسنلی {PersonnelCode} نام محل خدمت (برای شاغلین) {Department} درخواست صدور گواهی حقوقی جهت ضمانت وام آقای / خانم {BorrowerName} فرزند {BorrowerFatherName} برای {BankName} به مبلغ {LoanAmount} ریال ({LoanAmountWords}) را دارم. و ضمن عقد خارج لازم به آن اداره محترم، وکالت بلاعزل می‌دهم چنانچه به هر دلیل اقساط وام مزبور پرداخت نگردد، اقساط معوقه ماهیانه همراه با تمامی هزینه‌های پستی و... به هر میزان که باشد از حقوق و مزایای اینجانب کسر و به حساب مربوطه واریز گردد.

--------------------------------------------------
[بخش تعهد بازپرداخت و ضمانت رسمی اداره به بانک]
رئیس محترم {BankName} - {BranchName}
با سلام و احترام
گواهی می‌شود {FullName} نام پدر {FatherName} و کد ملی {NationalCode} همکار {EmploymentType} با کد پرسنلی {PersonnelCode} این اداره متقاضی ضمانت آقای / خانم {BorrowerName} نام پدر {BorrowerFatherName} تا مبلغ {LoanAmount} ریال ({LoanAmountWords}) می‌باشد و براساس آخرین وضعیت حقوقی، نامبرده ماهیانه مبلغ {NetSalary} ریال ({NetSalaryWords}) حقوق و مزایا دریافت می‌نماید. بدیهی است این اداره در صورت تعویق اقساط وام، با شرایط زیر و طی مراحل اجرایی توسط آن بانک یا موسسه مالی اقدام خواهد نمود:

۱- این تعهد فقط تا زمانی که متقاضی ضمانت در قید حیات بوده و از این اداره حقوق و مزایا دریافت می‌کند معتبر بوده و در غیر این صورت این اداره تعهدی نخواهد داشت.
۲- گواهی حقوقی و ضمانت‌نامه فقط جهت همکاران شاغل و بازنشسته رسمی یا پیمانی صادر گردیده و برای بانک‌ها و موسسات مالی دولتی و خصوصی دارای مجوز از بانک مرکزی معتبر است.
۳- این اداره در صورت تعویق اقساط وام منوط به رعایت موارد مذکور طبق قانون اجرای احکام مدنی حداکثر تا یک چهارم در صورت تاهل و یک سوم در صورت تجرد از حقوق و مزایای متعهد کسر می‌نماید.
۴- این تعهدنامه بنا به درخواست نامبرده صادر گردیده و تایید اصالت آن منوط به استعلام کتبی از طرف بانک یا موسسه مالی خواهد بود.
۵- این تعهدنامه در تاریخ {Date} صادر گردیده و تا ۳۰ روز جهت ارائه به بانک یا موسسه مالی اعتبار دارد.`,
  },
  {
    id: 'tpl_estelam_twopiece',
    type: 'inquiry_twopiece',
    title: 'قالب رسمی پاسخ به استعلام بانکی (دو تکه افقی A4)',
    description: 'تمپلیت رسمی استعلام در یک ورق A4 افقی دو تکه (نسخه بانک و نسخه بایگانی اداره همراه با بارکد و خط برش)',
    isDefault: true,
    lastUpdated: '۱۴۰۳/۰۸/۲۰',
    content: `رئیس محترم: {BankName} - {BranchName}

با سلام و احترام
عطف به نامه شماره {BankLetterNo} مورخ {BankLetterDate}
ضمانت‌نامه / گواهی شماره {CertificateNo} مورخ {Date} متعلق به {FullName} کارمند {EmploymentType} این اداره، به نام وام‌گیرنده آقای / خانم {BorrowerName} فرزند {BorrowerFatherName} به مبلغ {LoanAmount} ریال ({LoanAmountWords}) مورد تأیید می‌باشد.

{SignerName}
{SignerRole}`,
  },
  {
    id: 'tpl_inquiry_standard',
    type: 'inquiry',
    title: 'قالب استعلام بانکی استاندارد (تک‌برگ عمودی)',
    description: 'تمپلیت پاسخ به نامه‌های استعلام تسهیلات و اعتبار در قطع عمودی',
    isDefault: false,
    lastUpdated: '۱۴۰۳/۰۸/۲۰',
    content: `رئیس محترم {BankName} - {BranchName}

با سلام و احترام؛
بازگشت به نامه شماره {BankLetterNo} مورخ {BankLetterDate} در خصوص استعلام وضعیت شغلی و اعتباری آقای / خانم {FullName} فرزند {FatherName} به شماره ملی {NationalCode} و شماره پرسنلی {PersonnelCode}؛

به استحضار می‌رساند نامبرده با نوع استخدام «{EmploymentType}» در سمت «{JobTitle}» در این مجموعه مشغول به خدمت بوده و وضعیت خدمت ایشان کاملاً فعال و معتبر است. ضمانت یا گواهی صادره برای تسهیلات به میزان {LoanAmount} ({LoanAmountWords}) به شماره {CertificateNo} مورد تأیید رسمی این سازمان می‌باشد.

{SignerName}
{SignerRole}`,
  },
  {
    id: 'tpl_verification',
    type: 'verification',
    title: 'قالب اختصاصی برگه اصالت‌سنجی الکترونیکی سند',
    description: 'تمپلیت اختصاصی استعلام و تأیید اصالت گواهی و ضمانت‌نامه بانکی با مهر و بارکد امنیتی',
    isDefault: true,
    lastUpdated: '۱۴۰۳/۰۸/۲۰',
    content: `برگه تأییدیه رسمی اصالت‌سنجی الکترونیکی اسناد اداری

بدین‌وسیله به استحضار کلیه مراجع قانونی، بانک‌ها و موسسات مالی می‌رساند که سند با مشخصات ذیل، در سامانه یکپارچه صدور گواهی و ضمانت‌نامه ثبت گردیده و دارای اصالت قطعی و اعتبار قانونی می‌باشد:

• شماره ثبت دبیرخانه: {CertificateNo}
• شناسه امنیتی رهگیری: {TrackingCode}
• تاریخ صدور سند: {Date}
• نام و مشخصات همکار: {FullName} (کد ملی: {NationalCode} - کد پرسنلی: {PersonnelCode})
• وضعیت استخدام و خدمت: {EmploymentType} - {Department}
• بانک و شعبه مقصد: {BankName} ({BranchName})
• مبلغ مورد تعهد: {LoanAmount} ریال ({LoanAmountWords})
• ذینفع و وام‌گیرنده: آقای / خانم {BorrowerName}

اصالت این سند با استفاده از کلید رمزنگاری سیستمی و امضای دیجیتال مورد تأیید {OrgTitle} است.`,
  },
];
