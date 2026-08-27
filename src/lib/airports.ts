// Static worldwide airports dataset (schema-free).
//
// The product has no `airports` table, so this bundled list powers the
// "select the airport (مطار)" dropdowns in the quick booking flow without
// any DB change. Selecting an airport writes its label (name + IATA + country)
// into the existing `origin` / `destination` free-text columns.
//
// `code` = IATA code, `nameAr` = Arabic airport name, `countryAr` = Arabic
// country name, `cityAr` = Arabic city name. `t` is a searchable alias.

export type Airport = {
  code: string;
  nameAr: string;
  cityAr: string;
  countryAr: string;
};

// Search keys built once at runtime for fast filtering.
let _searchMap: Map<string, { label: string; airport: Airport }> | null = null;

function buildSearchMap() {
  const map = new Map<string, { label: string; airport: Airport }>();
  const seen = new Set<string>();
  for (const a of EUROPE_AIRPORTS.concat(
    MIDDLE_EAST_AFRICA_AIRPORTS,
    ASIA_AIRPORTS,
    AMERICAS_AIRPORTS,
    OTHER_AIRPORTS
  )) {
    if (seen.has(a.code)) continue;
    seen.add(a.code);
    const label = `مطار ${a.nameAr} (${a.code}) — ${a.cityAr}، ${a.countryAr}`;
    map.set(a.code, { label, airport: a });
    map.set(a.nameAr, { label, airport: a });
  }
  return map;
}

export function getAirportLabel(airport: Airport): string {
  return `مطار ${airport.nameAr} (${airport.code}) — ${airport.cityAr}، ${airport.countryAr}`;
}

export function searchAirports(query: string, limit = 40): Airport[] {
  if (!_searchMap) _searchMap = buildSearchMap();
  const q = query.trim().toLowerCase();
  if (!q) {
    // Return a default popular slice first.
    return POPULAR_AIRPORTS;
  }
  const results: Airport[] = [];
  for (const [, v] of _searchMap) {
    if (results.length >= limit) break;
    if (
      v.airport.code.toLowerCase().startsWith(q) ||
      v.airport.nameAr.toLowerCase().includes(q) ||
      v.airport.cityAr.toLowerCase().includes(q) ||
      v.airport.countryAr.toLowerCase().includes(q)
    ) {
      results.push(v.airport);
    }
  }
  return results.length ? results : POPULAR_AIRPORTS;
}

export function findAirportByCode(code: string): Airport | undefined {
  if (!_searchMap) _searchMap = buildSearchMap();
  return _searchMap.get(code)?.airport;
}

export const POPULAR_AIRPORTS: Airport[] = [
  { code: "CAI", nameAr: "القاهرة الدولي", cityAr: "القاهرة", countryAr: "مصر" },
  { code: "DXB", nameAr: "دبي الدولي", cityAr: "دبي", countryAr: "الإمارات" },
  { code: "JED", nameAr: "الملك عبد العزيز", cityAr: "جدة", countryAr: "السعودية" },
  { code: "RUH", nameAr: "الملك خالد الدولي", cityAr: "الرياض", countryAr: "السعودية" },
  { code: "DOH", nameAr: "حمد الدولي", cityAr: "الدوحة", countryAr: "قطر" },
  { code: "AUH", nameAr: "زayed الدولي", cityAr: "أبوظبي", countryAr: "الإمارات" },
  { code: "IST", nameAr: "إسطنبول الدولي", cityAr: "إسطنبول", countryAr: "تركيا" },
  { code: "LHR", nameAr: "هيثرو", cityAr: "لندن", countryAr: "المملكة المتحدة" },
  { code: "CDG", nameAr: "شارل ديغول", cityAr: "باريس", countryAr: "فرنسا" },
  { code: "AMS", nameAr: "سخيبول", cityAr: "أمستردام", countryAr: "هولندا" },
  { code: "FRA", nameAr: "فرانكفورت", cityAr: "فرانكفورت", countryAr: "ألمانيا" },
  { code: "MAD", nameAr: "أدولفو سواريث مدريد-باراخاس", cityAr: "مدريد", countryAr: "إسبانيا" },
  { code: "JFK", nameAr: "جون كينيدي", cityAr: "نيويورك", countryAr: "الولايات المتحدة" },
];

// ---- Middle East & Africa ----
export const MIDDLE_EAST_AFRICA_AIRPORTS: Airport[] = [
  // Egypt
  { code: "CAI", nameAr: "القاهرة الدولي", cityAr: "القاهرة", countryAr: "مصر" },
  { code: "HBE", nameAr: "برج العرب الدولي", cityAr: "الإسكندرية", countryAr: "مصر" },
  { code: "HRG", nameAr: "الغردقة الدولي", cityAr: "الغردقة", countryAr: "مصر" },
  { code: "SSH", nameAr: "شرم الشيخ الدولي", cityAr: "شرم الشيخ", countryAr: "مصر" },
  { code: "LXR", nameAr: "الأقصر الدولي", cityAr: "الأقصر", countryAr: "مصر" },
  { code: "ASW", nameAr: "أسوان الدولي", cityAr: "أسوان", countryAr: "مصر" },
  { code: "TCP", nameAr: "طابا الدولي", cityAr: "طابا", countryAr: "مصر" },
  { code: "ALY", nameAr: "النزهة", cityAr: "الإسكندرية", countryAr: "مصر" },
  // Gulf
  { code: "DXB", nameAr: "دبي الدولي", cityAr: "دبي", countryAr: "الإمارات" },
  { code: "AUH", nameAr: "زayed الدولي", cityAr: "أبوظبي", countryAr: "الإمارات" },
  { code: "SHJ", nameAr: "الشارقة الدولي", cityAr: "الشارقة", countryAr: "الإمارات" },
  { code: "DOH", nameAr: "حمد الدولي", cityAr: "الدوحة", countryAr: "قطر" },
  { code: "JED", nameAr: "الملك عبد العزيز", cityAr: "جدة", countryAr: "السعودية" },
  { code: "RUH", nameAr: "الملك خالد الدولي", cityAr: "الرياض", countryAr: "السعودية" },
  { code: "DMM", nameAr: "الملك فهد الدولي", cityAr: "الدمام", countryAr: "السعودية" },
  { code: "MED", nameAr: "الأمير محمد بن عبد العزيز", cityAr: "المدينة المنورة", countryAr: "السعودية" },
  { code: "DAM", nameAr: "دمشق الدولي", cityAr: "دمشق", countryAr: "سوريا" },
  { code: "BEY", nameAr: "رفيق الحريري الدولي", cityAr: "بيروت", countryAr: "لبنان" },
  { code: "AMM", nameAr: "الملكة علياء الدولي", cityAr: "عمّان", countryAr: "الأردن" },
  { code: "BGW", nameAr: "بغداد الدولي", cityAr: "بغداد", countryAr: "العراق" },
  { code: "BSR", nameAr: "البصرة الدولي", cityAr: "البصرة", countryAr: "العراق" },
  { code: "KWI", nameAr: "الكويت الدولي", cityAr: "الكويت", countryAr: "الكويت" },
  { code: "BAH", nameAr: "البحرين الدولي", cityAr: "المنامة", countryAr: "البحرين" },
  { code: "MCT", nameAr: "مسقط الدولي", cityAr: "مسقط", countryAr: "عُمان" },
  { code: "SLL", nameAr: "صلالة", cityAr: "صلالة", countryAr: "عُمان" },
  { code: "SAH", nameAr: "صنعاء الدولي", cityAr: "صنعاء", countryAr: "اليمن" },
  { code: "ADE", nameAr: "عدن الدولي", cityAr: "عدن", countryAr: "اليمن" },
  { code: "TUN", nameAr: "تونس قرطاج الدولي", cityAr: "تونس", countryAr: "تونس" },
  { code: "ALG", nameAr: "هواري بومدين الدولي", cityAr: "الجزائر", countryAr: "الجزائر" },
  { code: "CMN", nameAr: "محمد الخامس الدولي", cityAr: "الدار البيضاء", countryAr: "المغرب" },
  { code: "RAK", nameAr: "مراكش المنارة", cityAr: "مراكش", countryAr: "المغرب" },
  { code: "TIP", nameAr: "مطار طرابلس الدولي", cityAr: "طرابلس", countryAr: "ليبيا" },
  { code: "BEN", nameAr: "بنغازي", cityAr: "بنغازي", countryAr: "ليبيا" },
  { code: "KRT", nameAr: "الخرطوم الدولي", cityAr: "الخرطوم", countryAr: "السودان" },
  { code: "ADD", nameAr: "بول الدولي", cityAr: "أديس أبابا", countryAr: "إثيوبيا" },
  { code: "NBO", nameAr: "جومو كينياتا الدولي", cityAr: "نيروبي", countryAr: "كينيا" },
  { code: "MBA", nameAr: "مومباسا الدولي", cityAr: "مومباسا", countryAr: "كينيا" },
  { code: "EBB", nameAr: "إنتيبي", cityAr: "كمبالا", countryAr: "أوغندا" },
  { code: "LOS", nameAr: "مورتالا محمد الدولي", cityAr: "لاغوس", countryAr: "نيجيريا" },
  { code: "ACC", nameAr: "كوتوكا الدولي", cityAr: "أكرا", countryAr: "غانا" },
  { code: "ABJ", nameAr: "فليكس هوفويت-بوانيي", cityAr: "أبيدجان", countryAr: "ساحل العاج" },
  { code: "DAR", nameAr: "جوليوس نيريري", cityAr: "دار السلام", countryAr: "تنزانيا" },
  { code: "JNB", nameAr: "أو. آر. تامبو الدولي", cityAr: "جوهانسبرغ", countryAr: "جنوب أفريقيا" },
  { code: "CPT", nameAr: "كيب تاون الدولي", cityAr: "كيب تاون", countryAr: "جنوب أفريقيا" },
  { code: "DUR", nameAr: "كينغ شاكا الدولي", cityAr: "ديربان", countryAr: "جنوب أفريقيا" },
  { code: "LAD", nameAr: "كواترو دي فيفيريرو", cityAr: "لواندا", countryAr: "أنغولا" },
  { code: "MPM", nameAr: "مابوتو الدولي", cityAr: "مابوتو", countryAr: "موزمبيق" },
];

// ---- Europe ----
export const EUROPE_AIRPORTS: Airport[] = [
  { code: "LHR", nameAr: "هيثرو", cityAr: "لندن", countryAr: "المملكة المتحدة" },
  { code: "LGW", nameAr: "غاتويك", cityAr: "لندن", countryAr: "المملكة المتحدة" },
  { code: "MAN", nameAr: "مانشستر", cityAr: "مانشستر", countryAr: "المملكة المتحدة" },
  { code: "BHX", nameAr: "برمنغهام", cityAr: "برمنغهام", countryAr: "المملكة المتحدة" },
  { code: "EDI", nameAr: "إدنبرة", cityAr: "إدنبرة", countryAr: "المملكة المتحدة" },
  { code: "CDG", nameAr: "شارل ديغول", cityAr: "باريس", countryAr: "فرنسا" },
  { code: "ORY", nameAr: "أورلي", cityAr: "باريس", countryAr: "فرنسا" },
  { code: "NCE", nameAr: "كوت دازور", cityAr: "نيس", countryAr: "فرنسا" },
  { code: "LYS", nameAr: "ليون-سان إكزوبيري", cityAr: "ليون", countryAr: "فرنسا" },
  { code: "MRS", nameAr: "مرسيليا بروفانس", cityAr: "مرسيليا", countryAr: "فرنسا" },
  { code: "FRA", nameAr: "فرانكفورت", cityAr: "فرانكفورت", countryAr: "ألمانيا" },
  { code: "MUC", nameAr: "ميونخ", cityAr: "ميونخ", countryAr: "ألمانيا" },
  { code: "BER", nameAr: "برلين براندنبورغ", cityAr: "برلين", countryAr: "ألمانيا" },
  { code: "HAM", nameAr: "هامبورغ", cityAr: "هامبورغ", countryAr: "ألمانيا" },
  { code: "CGN", nameAr: "كولونيا/بون", cityAr: "كولونيا", countryAr: "ألمانيا" },
  { code: "AMS", nameAr: "سخيبول", cityAr: "أمستردام", countryAr: "هولندا" },
  { code: "BRU", nameAr: "بروكسل", cityAr: "بروكسل", countryAr: "بلجيكا" },
  { code: "ZRH", nameAr: "زيورخ", cityAr: "زيورخ", countryAr: "سويسرا" },
  { code: "GVA", nameAr: "جنيف", cityAr: "جنيف", countryAr: "سويسرا" },
  { code: "VIE", nameAr: "فيينا الدولي", cityAr: "فيينا", countryAr: "النمسا" },
  { code: "MAD", nameAr: "أدولفو سواريث مدريد-باراخاس", cityAr: "مدريد", countryAr: "إسبانيا" },
  { code: "BCN", nameAr: "إل برات", cityAr: "برشلونة", countryAr: "إسبانيا" },
  { code: "AGP", nameAr: "مالقة الدولي", cityAr: "مالقة", countryAr: "إسبانيا" },
  { code: "PMI", nameAr: "بالما دي مايوركا", cityAr: "مايوركا", countryAr: "إسبانيا" },
  { code: "LIS", nameAr: "هومبيرتو دلغادو", cityAr: "لشبونة", countryAr: "البرتغال" },
  { code: "OPO", nameAr: "فرانسيسكو سا كارنيرو", cityAr: "بورتو", countryAr: "البرتغال" },
  { code: "FCO", nameAr: "ليوناردو دافنشي فيوميتشينو", cityAr: "روما", countryAr: "إيطاليا" },
  { code: "MXP", nameAr: "مالبينسا", cityAr: "ميلانو", countryAr: "إيطاليا" },
  { code: "LIN", nameAr: "ليناتي", cityAr: "ميلانو", countryAr: "إيطاليا" },
  { code: "VCE", nameAr: "ماركو بولو", cityAr: "البندقية", countryAr: "إيطاليا" },
  { code: "NAP", nameAr: "نابولي الدولي", cityAr: "نابولي", countryAr: "إيطاليا" },
  { code: "ATH", nameAr: "أثينا الدولي", cityAr: "أثينا", countryAr: "اليونان" },
  { code: "SKG", nameAr: "سالونيك الدولي", cityAr: "سالونيك", countryAr: "اليونان" },
  { code: "IST", nameAr: "إسطنبول الدولي", cityAr: "إسطنبول", countryAr: "تركيا" },
  { code: "SAW", nameAr: "صبيحة غوكتشين الدولي", cityAr: "إسطنبول", countryAr: "تركيا" },
  { code: "AYT", nameAr: "أنطاليا الدولي", cityAr: "أنطاليا", countryAr: "تركيا" },
  { code: "ADB", nameAr: "أدن مندريس", cityAr: "إزمير", countryAr: "تركيا" },
  { code: "CPH", nameAr: "كوبنهاغن", cityAr: "كوبنهاغن", countryAr: "الدنمارك" },
  { code: "OSL", nameAr: "أوسلو غاردرموين", cityAr: "أوسلو", countryAr: "النرويج" },
  { code: "STO", nameAr: "أرلاندا", cityAr: "ستوكهولم", countryAr: "السويد" },
  { code: "HEL", nameAr: "هلسنكي فانتا", cityAr: "هلسنكي", countryAr: "فنلندا" },
  { code: "DUB", nameAr: "دبلن", cityAr: "دبلن", countryAr: "أيرلندا" },
  { code: "WAW", nameAr: "وارسو شوبان", cityAr: "وارسو", countryAr: "بولندا" },
  { code: "KRK", nameAr: "كراكوف-باليتسه", cityAr: "كراكوف", countryAr: "بولندا" },
  { code: "PRG", nameAr: "فاتسلاف هافيل", cityAr: "براغ", countryAr: "التشيك" },
  { code: "BUD", nameAr: "بودابست فيرينك ليس", cityAr: "بودابست", countryAr: "المجر" },
  { code: "OTP", nameAr: "هنري كواندا", cityAr: "بوخارست", countryAr: "رومانيا" },
  { code: "SOF", nameAr: "صوفيا", cityAr: "صوفيا", countryAr: "بلغاريا" },
  { code: "BEG", nameAr: "نيكولا تسلا", cityAr: "بلغراد", countryAr: "صربيا" },
  { code: "LED", nameAr: "بولكوفو", cityAr: "سانت بطرسبرغ", countryAr: "روسيا" },
  { code: "SVO", nameAr: "شيريميتييفو", cityAr: "موسكو", countryAr: "روسيا" },
  { code: "DME", nameAr: "دوموديدوفو", cityAr: "موسكو", countryAr: "روسيا" },
];

// ---- Asia ----
export const ASIA_AIRPORTS: Airport[] = [
  { code: "PEK", nameAr: "بكين العاصمة الدولي", cityAr: "بكين", countryAr: "الصين" },
  { code: "PKX", nameAr: "بكين داشينغ الدولي", cityAr: "بكين", countryAr: "الصين" },
  { code: "PVG", nameAr: "شنغهاي بودونغ الدولي", cityAr: "شنغهاي", countryAr: "الصين" },
  { code: "CAN", nameAr: "قوانغتشو باييون الدولي", cityAr: "قوانغتشو", countryAr: "الصين" },
  { code: "SZX", nameAr: "شنتشن باوآن الدولي", cityAr: "شنتشن", countryAr: "الصين" },
  { code: "CTU", nameAr: "تشينغدو شوانغليو", cityAr: "تشينغدو", countryAr: "الصين" },
  { code: "HKG", nameAr: "هونغ كونغ الدولي", cityAr: "هونغ كونغ", countryAr: "هونغ كونغ" },
  { code: "MFM", nameAr: "ماكاو الدولي", cityAr: "ماكاو", countryAr: "ماكاو" },
  { code: "TPE", nameAr: "تاوان تايوان-داويون", cityAr: "تايبي", countryAr: "تايوان" },
  { code: "HND", nameAr: "طوكيو هانيدا", cityAr: "طوكيو", countryAr: "اليابان" },
  { code: "NRT", nameAr: "ناريتا الدولي", cityAr: "طوكيو", countryAr: "اليابان" },
  { code: "KIX", nameAr: "كانساي الدولي", cityAr: "أوساكا", countryAr: "اليابان" },
  { code: "ICN", nameAr: "إنتشون الدولي", cityAr: "سيول", countryAr: "كوريا الجنوبية" },
  { code: "SIN", nameAr: "شانغي", cityAr: "سنغافورة", countryAr: "سنغافورة" },
  { code: "KUL", nameAr: "كوالالمبور الدولي", cityAr: "كوالالمبور", countryAr: "ماليزيا" },
  { code: "BKK", nameAr: "سوفارنابومي", cityAr: "بانكوك", countryAr: "تايلاند" },
  { code: "DMK", nameAr: "دون موينغ الدولي", cityAr: "بانكوك", countryAr: "تايلاند" },
  { code: "HKT", nameAr: "فوكيت الدولي", cityAr: "فوكيت", countryAr: "تايلاند" },
  { code: "CGK", nameAr: "سوكارنو-هاتا الدولي", cityAr: "جاكرتا", countryAr: "إندونيسيا" },
  { code: "DPS", nameAr: "نغوراه راي الدولي", cityAr: "بالي/دينباسار", countryAr: "إندونيسيا" },
  { code: "MNL", nameAr: "نينوي أكينو الدولي", cityAr: "مانيلا", countryAr: "الفلبين" },
  { code: "HAN", nameAr: "نوي باي الدولي", cityAr: "هانوي", countryAr: "فيتنام" },
  { code: "SGN", nameAr: "تان سون نهات الدولي", cityAr: "مدينة هو تشي منه", countryAr: "فيتنام" },
  { code: "DEL", nameAr: "إنديرا غاندي الدولي", cityAr: "دلهي", countryAr: "الهند" },
  { code: "BOM", nameAr: "تشاتراباتي شيفاجي", cityAr: "مومباي", countryAr: "الهند" },
  { code: "BLR", nameAr: "كيمبيغودا الدولي", cityAr: "بنغالور", countryAr: "الهند" },
  { code: "MAA", nameAr: "تشيناي الدولي", cityAr: "تشيناي", countryAr: "الهند" },
  { code: "CCU", nameAr: "نتاجي سوبهاش تشاندرا بوز", cityAr: "كلكتا", countryAr: "الهند" },
  { code: "HYD", nameAr: "راجيف غاندي الدولي", cityAr: "حيدر أباد", countryAr: "الهند" },
  { code: "KHI", nameAr: "جناح الدولي", cityAr: "كراتشي", countryAr: "باكستان" },
  { code: "LHE", nameAr: "علامة إقبال الدولية", cityAr: "لاهور", countryAr: "باكستان" },
  { code: "ISB", nameAr: "اسلام اباد الدولي", cityAr: "إسلام أباد", countryAr: "باكستان" },
  { code: "KBL", nameAr: "كابول الدولي", cityAr: "كابول", countryAr: "أفغانستان" },
  { code: "THR", nameAr: "مهرآباد الدولي", cityAr: "طهران", countryAr: "إيران" },
  { code: "IKA", nameAr: "الإمام الخميني الدولي", cityAr: "طهران", countryAr: "إيران" },
  { code: "MHD", nameAr: "مشهد الدولي", cityAr: "مشهد", countryAr: "إيران" },
  { code: "SYZ", nameAr: "شيراز الدولي", cityAr: "شيراز", countryAr: "إيران" },
  { code: "TBZ", nameAr: "تبريز الدولي", cityAr: "تبريز", countryAr: "إيران" },
  { code: "KBP", nameAr: "بوريسبيل الدولي", cityAr: "كييف", countryAr: "أوكرانيا" },
];

// ---- Americas ----
export const AMERICAS_AIRPORTS: Airport[] = [
  { code: "JFK", nameAr: "جون كينيدي الدولي", cityAr: "نيويورك", countryAr: "الولايات المتحدة" },
  { code: "EWR", nameAr: "ليبرتي نيوارك", cityAr: "نيو جيرسي", countryAr: "الولايات المتحدة" },
  { code: "LAX", nameAr: "لوس أنجلوس الدولي", cityAr: "لوس أنجلوس", countryAr: "الولايات المتحدة" },
  { code: "ORD", nameAr: "أوهير الدولي", cityAr: "شيكاغو", countryAr: "الولايات المتحدة" },
  { code: "DFW", nameAr: "دالاس/فورت وورث", cityAr: "دالاس", countryAr: "الولايات المتحدة" },
  { code: "MIA", nameAr: "ميامي الدولي", cityAr: "ميامي", countryAr: "الولايات المتحدة" },
  { code: "SFO", nameAr: "سان فرانسيسكو الدولي", cityAr: "سان فرانسيسكو", countryAr: "الولايات المتحدة" },
  { code: "SEA", nameAr: "سياتل-تاكوما الدولي", cityAr: "سياتل", countryAr: "الولايات المتحدة" },
  { code: "BOS", nameAr: "لوغان الدولي", cityAr: "بوسطن", countryAr: "الولايات المتحدة" },
  { code: "IAD", nameAr: "دولس الدولي", cityAr: "واشنطن", countryAr: "الولايات المتحدة" },
  { code: "IAH", nameAr: "جورج بوش الدولي", cityAr: "هيوستن", countryAr: "الولايات المتحدة" },
  { code: "LAS", nameAr: "مطار ماكاران الدولي", cityAr: "لاس فيغاس", countryAr: "الولايات المتحدة" },
  { code: "MCO", nameAr: "أورلاندو الدولي", cityAr: "أورلاندو", countryAr: "الولايات المتحدة" },
  { code: "ATL", nameAr: "هارتسفيلد-جاكسون الدولي", cityAr: "أتلانتا", countryAr: "الولايات المتحدة" },
  { code: "YYZ", nameAr: "تورونتو بيرسون الدولي", cityAr: "تورونتو", countryAr: "كندا" },
  { code: "YVR", nameAr: "فانكوفر الدولي", cityAr: "فانكوفر", countryAr: "كندا" },
  { code: "YUL", nameAr: "مونتريال ترودو الدولي", cityAr: "مونتريال", countryAr: "كندا" },
  { code: "MEX", nameAr: "مطار بينيتو خواريز الدولي", cityAr: "مكسيكو سيتي", countryAr: "المكسيك" },
  { code: "CUN", nameAr: "كانكون الدولي", cityAr: "كانكون", countryAr: "المكسيك" },
  { code: "BOG", nameAr: "إلدورادو الدولي", cityAr: "بوغوتا", countryAr: "كولومبيا" },
  { code: "GRU", nameAr: "غوارولوس-كونغونهاس الدولي", cityAr: "ساو باولو", countryAr: "البرازيل" },
  { code: "GIG", nameAr: "غاليانو الدولي", cityAr: "ريو دي جانيرو", countryAr: "البرازيل" },
  { code: "EZE", nameAr: "مينسترو بيستاريني الدولي", cityAr: "بوينس آيرس", countryAr: "الأرجنتين" },
  { code: "SCL", nameAr: "أرتورو ميرينو بينيتيز الدولي", cityAr: "سانتياغو", countryAr: "تشيلي" },
  { code: "LIM", nameAr: "خورخي شافيز الدولي", cityAr: "ليما", countryAr: "بيرو" },
  { code: "PTY", nameAr: "توكومين الدولي", cityAr: "بنما سيتي", countryAr: "بنما" },
];

// ---- Other / Oceania ----
export const OTHER_AIRPORTS: Airport[] = [
  { code: "SYD", nameAr: "كينغسفورد سميث", cityAr: "سيدني", countryAr: "أستراليا" },
  { code: "MEL", nameAr: "ميلبورن الدولي", cityAr: "ميلبورن", countryAr: "أستراليا" },
  { code: "BNE", nameAr: "بريزبن الدولي", cityAr: "بريزبن", countryAr: "أستراليا" },
  { code: "PER", nameAr: "بيرث الدولي", cityAr: "بيرث", countryAr: "أستراليا" },
  { code: "AKL", nameAr: "أوكلاند الدولي", cityAr: "أوكلاند", countryAr: "نيوزيلندا" },
  { code: "WLG", nameAr: "ويلينغتون الدولي", cityAr: "ويلينغتون", countryAr: "نيوزيلندا" },
  { code: "JOG", nameAr: "أديسوتشيبتو الدولي", cityAr: "يوجياكرتا", countryAr: "إندونيسيا" },
];
