namespace EducationCertPortal.Services;

public interface IBarcodeService
{
    string GenerateCode128Svg(string content, int height = 40, int width = 200);
    string GenerateQrCodeSvg(string content, int size = 100);
    string GenerateUnguessableTrackingCode();
    string FormatCurrency(decimal amount);
    string ToPersianDigits(string input);
    string ToPersianDigits(int number);
    string ToPersianDigits(decimal number);
    string ToPersianDate(DateTime date);
}
