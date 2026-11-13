using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using QRCoder;

namespace EducationCertPortal.Services;

public class BarcodeService : IBarcodeService
{
    private static readonly PersianCalendar _persianCalendar = new();
    private static readonly char[] _alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ".ToCharArray();

    public string GenerateUnguessableTrackingCode()
    {
        // 60-bit entropy using cryptographically secure random number generator (CSPRNG)
        var buffer = new byte[12];
        RandomNumberGenerator.Fill(buffer);

        var chars = new char[12];
        for (int i = 0; i < 12; i++)
        {
            chars[i] = _alphabet[buffer[i] % _alphabet.Length];
        }

        var part1 = new string(chars, 0, 4);
        var part2 = new string(chars, 4, 4);
        var part3 = new string(chars, 8, 4);

        return $"TRK-{part1}-{part2}-{part3}";
    }

    public string GenerateQrCodeSvg(string content, int size = 100)
    {
        try
        {
            using var qrGenerator = new QRCodeGenerator();
            using var qrCodeData = qrGenerator.CreateQrCode(content, QRCodeGenerator.ECCLevel.M);
            using var qrCode = new SvgQRCode(qrCodeData);
            return qrCode.GetGraphic(new System.Drawing.Size(size, size), "#000000", "#FFFFFF", true);
        }
        catch
        {
            // Fallback safe SVG if QRCoder graphic encounters environment constraints
            return $"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"{size}\" height=\"{size}\" viewBox=\"0 0 100 100\"><rect width=\"100\" height=\"100\" fill=\"#ffffff\"/><text x=\"50\" y=\"50\" font-size=\"10\" text-anchor=\"middle\" fill=\"#333333\">QR Code</text></svg>";
        }
    }

    public string GenerateCode128Svg(string content, int height = 40, int width = 200)
    {
        // Standard ISO/IEC 15417 Code 128 (Subset B)
        // Clean, direct SVG bar pattern generator with Modulo-103 checksum
        var clean = string.IsNullOrEmpty(content) ? "CODE128" : content.Trim();
        var patterns = GetCode128Patterns();

        int startB = 104;
        int checkSum = startB;
        var barSequence = new StringBuilder();

        barSequence.Append(patterns[startB]);

        for (int i = 0; i < clean.Length; i++)
        {
            char c = clean[i];
            int ascii = (int)c;
            int code = (ascii >= 32 && ascii <= 126) ? ascii - 32 : 0;
            checkSum += (i + 1) * code;
            barSequence.Append(patterns[code]);
        }

        int checkDigit = checkSum % 103;
        barSequence.Append(patterns[checkDigit]);
        barSequence.Append(patterns[106]); // Stop symbol

        string bars = barSequence.ToString();
        var svg = new StringBuilder();
        svg.Append($"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"{width}\" height=\"{height}\" viewBox=\"0 0 {bars.Length} {height}\" shape-rendering=\"crispEdges\">");
        svg.Append($"<rect width=\"100%\" height=\"100%\" fill=\"#ffffff\"/>");

        for (int i = 0; i < bars.Length; i++)
        {
            if (bars[i] == '1')
            {
                svg.Append($"<rect x=\"{i}\" y=\"0\" width=\"1\" height=\"{height}\" fill=\"#000000\"/>");
            }
        }

        svg.Append("</svg>");
        return svg.ToString();
    }

    public string ToPersianDate(DateTime date)
    {
        int year = _persianCalendar.GetYear(date);
        int month = _persianCalendar.GetMonth(date);
        int day = _persianCalendar.GetDayOfMonth(date);
        return $"{year:0000}/{month:00}/{day:00}";
    }

    public string FormatCurrency(decimal amount)
    {
        return string.Format("{0:N0}", amount)
            .Replace("0", "۰")
            .Replace("1", "۱")
            .Replace("2", "۲")
            .Replace("3", "۳")
            .Replace("4", "۴")
            .Replace("5", "۵")
            .Replace("6", "۶")
            .Replace("7", "۷")
            .Replace("8", "۸")
            .Replace("9", "۹") + " ریال";
    }

    public string ToPersianDigits(string input)
    {
        if (string.IsNullOrEmpty(input)) return string.Empty;
        return input
            .Replace("0", "۰")
            .Replace("1", "۱")
            .Replace("2", "۲")
            .Replace("3", "۳")
            .Replace("4", "۴")
            .Replace("5", "۵")
            .Replace("6", "۶")
            .Replace("7", "۷")
            .Replace("8", "۸")
            .Replace("9", "۹");
    }

    public string ToPersianDigits(int number) => ToPersianDigits(number.ToString());
    public string ToPersianDigits(decimal number) => ToPersianDigits(number.ToString("0"));

    private static string[] GetCode128Patterns()
    {
        return new string[]
        {
            "11011001100","11001101100","11001100110","10010011000","10010001100","10001001100","10011001000","10011000100","10001100100","11001001000",
            "11001000100","11000100100","10110011100","10011011100","10011001110","10111001100","10011101100","10011100110","11001110010","11001011100",
            "11001001110","11011100100","11001110100","11101101110","11101001100","11100101100","11100100110","11101100100","11100110100","11100110010",
            "11011011000","11011000110","11000110110","10100011000","10001011000","10001000110","10110001000","10001101000","10001100010","11010001000",
            "11000101000","11000100010","10110111000","10110001110","10001101110","10111011000","10111000110","10001110110","11101110110","11010001110",
            "11000101110","11011101000","11011100010","11011101110","11101011000","11101000110","11100010110","11101101000","11101100010","11100011010",
            "11101111010","11001000010","11110001010","10100110000","10100001100","10010110000","10010000110","10000101100","10000100110","10110010000",
            "10110000100","10011010000","10011000010","10000110100","10000110010","11000010010","11001010000","11110111010","11000010100","10001111010",
            "10100111100","10010111100","10010011110","10111100100","10011110100","10011110010","11110100100","11110010100","11110010010","11011011110",
            "11011110110","11110110110","10101111000","10100011110","10001011110","10111101000","10111100010","11110101000","11110100010","10111011110",
            "10111101110","11101011110","11110101110","11010000100","11010010000","11010011100","1100011101011"
        };
    }
}
