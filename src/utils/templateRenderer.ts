import { Certificate, Personnel, SystemSettings } from '../types';
import { amountToPersianWords, formatCurrency, toPersianDigits, cleanPersian } from './persianUtils';

export function renderLetterTemplate(
  templateContent: string,
  certificate: Certificate,
  personnel: Personnel,
  settings: SystemSettings
): string {
  const currency = settings.currency;

  const replacements: Record<string, string> = {
    '{OrgTitle}': settings.orgTitle || 'سازمان مرکزی',
    '{ManagingUnit}': settings.managingUnit || 'اداره کل امور اداری و رفاه',
    '{OrgAddress}': settings.orgAddress || '',
    '{OrgPhone}': settings.orgPhone || '',
    '{SignerName}': settings.signerName || '',
    '{SignerRole}': settings.signerRole || '',
    '{CertificateNo}': certificate.certificateNo ? toPersianDigits(certificate.certificateNo) : '--- (در انتظار تأیید دبیرخانه)',
    '{TrackingCode}': toPersianDigits(certificate.trackingCode),
    '{Date}': toPersianDigits(certificate.approvedAt || certificate.createdAt),

    '{FullName}': cleanPersian(personnel.fullName),
    '{FatherName}': cleanPersian(personnel.fatherName),
    '{NationalCode}': toPersianDigits(personnel.nationalCode),
    '{PersonnelCode}': toPersianDigits(personnel.personnelCode),
    '{EmploymentType}': personnel.employmentType,
    '{Department}': cleanPersian(personnel.department),
    '{JobTitle}': cleanPersian(personnel.jobTitle),
    '{NetSalary}': formatCurrency(personnel.netSalary, currency),
    '{NetSalaryWords}': amountToPersianWords(personnel.netSalary, currency),

    '{BankName}': cleanPersian(certificate.bankName),
    '{BranchName}': cleanPersian(certificate.branchName),
    '{BankLetterNo}': certificate.bankLetterNumber ? toPersianDigits(certificate.bankLetterNumber) : '---',
    '{BankLetterDate}': certificate.bankLetterDate ? toPersianDigits(certificate.bankLetterDate) : '---',

    '{LoanAmount}': formatCurrency(certificate.loanAmount, currency),
    '{LoanAmountWords}': amountToPersianWords(certificate.loanAmount, currency),
    '{MonthlyInstallment}': certificate.monthlyInstallment
      ? formatCurrency(certificate.monthlyInstallment, currency)
      : 'طبق اعلام بانک',
    '{BorrowerName}': certificate.borrowerType === 'self'
      ? cleanPersian(personnel.fullName)
      : cleanPersian(certificate.borrowerName || personnel.fullName),
    '{BorrowerNationalCode}': certificate.borrowerType === 'self'
      ? toPersianDigits(personnel.nationalCode)
      : toPersianDigits(certificate.borrowerNationalCode || ''),
    '{BorrowerFatherName}': certificate.borrowerType === 'self'
      ? cleanPersian(personnel.fatherName)
      : cleanPersian(certificate.borrowerFatherName || personnel.fatherName),
    '{BorrowerRelation}': certificate.borrowerType === 'self'
      ? 'خود پرسنل (وام‌گیرنده اصلی)'
      : cleanPersian(certificate.borrowerRelation || 'شخص ثالث'),
  };

  let rendered = templateContent;
  for (const [key, val] of Object.entries(replacements)) {
    rendered = rendered.split(key).join(val);
  }

  return cleanPersian(rendered);
}
