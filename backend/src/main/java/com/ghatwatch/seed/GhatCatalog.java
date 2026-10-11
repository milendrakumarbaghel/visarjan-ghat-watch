package com.ghatwatch.seed;

import com.ghatwatch.domain.Ghat;

import java.util.List;

/** The 7 Bhopal ghats in the data pack, with Hindi names for the brief. */
public final class GhatCatalog {

    public static final List<Ghat> GHATS = List.of(
            new Ghat("bairagarh", "Bairagarh (Sant Hirdaram) kund", "बैरागढ़ (संत हिरदाराम) कुंड",
                    "Upper Lake", "बड़ा तालाब", "high",
                    "No Durga 2025 table in the report.",
                    "रिपोर्ट में दुर्गा 2025 की तालिका नहीं है।"),
            new Ghat("khatlapura", "Khatlapura ghat", "खटलापुरा घाट",
                    "Lower Lake", "छोटा तालाब", "high", null, null),
            new Ghat("prempura", "Prempura ghat", "प्रेमपुरा घाट",
                    "Upper Lake", "बड़ा तालाब", "high", null, null),
            new Ghat("rani-kamlapati", "Rani Kamlapati ghat / Kamla Park kund", "रानी कमलापति घाट / कमला पार्क कुंड",
                    "Lower Lake", "छोटा तालाब", "medium",
                    "Ganesh tables say \"Kamla Park kund\", Durga tables say \"Lower Lake ghat\". "
                            + "These may be two different places.",
                    "गणेश तालिकाओं में \"कमला पार्क कुंड\" और दुर्गा तालिकाओं में \"लोअर लेक घाट\" लिखा है। "
                            + "ये दो अलग स्थान हो सकते हैं।"),
            new Ghat("hathaikheda", "Hathaikheda dam / kund", "हथाईखेड़ा डैम / कुंड",
                    "Hathaikheda dam", "हथाईखेड़ा डैम", "high", null, null),
            new Ghat("malikhedi", "Malikhedi kund", "मालीखेड़ी कुंड",
                    "Kund", "कुंड", "high",
                    "No Durga 2025 table in the report.",
                    "रिपोर्ट में दुर्गा 2025 की तालिका नहीं है।"),
            new Ghat("shahpura", "Shahpura lake ghat", "शाहपुरा झील घाट",
                    "Shahpura Lake", "शाहपुरा झील", "high", null, null));

    private GhatCatalog() {
    }
}
