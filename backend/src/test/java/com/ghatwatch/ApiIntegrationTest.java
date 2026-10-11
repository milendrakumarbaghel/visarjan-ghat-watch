package com.ghatwatch;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Boots the whole app on an in-memory database in PostgreSQL mode and calls the API over HTTP. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "spring.datasource.url=jdbc:h2:mem:ghatwatch;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH;NON_KEYWORDS=VALUE",
        "spring.datasource.username=sa",
        "spring.datasource.password="
})
class ApiIntegrationTest {

    @LocalServerPort
    int port;

    private final HttpClient http = HttpClient.newHttpClient();

    private HttpResponse<String> call(String method, String path, String body) throws IOException, InterruptedException {
        HttpRequest.Builder req = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path))
                .header("Content-Type", "application/json");
        req.method(method, body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(body));
        return http.send(req.build(), HttpResponse.BodyHandlers.ofString());
    }

    @Test
    void rankingPlanAndBriefWorkEndToEnd() throws Exception {
        HttpResponse<String> ranking = call("GET", "/api/ranking", null);
        assertEquals(200, ranking.statusCode());
        assertTrue(ranking.body().contains("\"doBreaches\":42"), ranking.body().substring(0, 300));
        assertTrue(ranking.body().contains("\"bodBreaches\":100"));
        assertTrue(ranking.body().indexOf("\"ghatId\":\"bairagarh\"") < ranking.body().indexOf("\"ghatId\":\"prempura\""));

        HttpResponse<String> durga = call("GET", "/api/ranking?scope=durga", null);
        assertTrue(durga.body().contains("\"scope\":\"DURGA\""));

        HttpResponse<String> detail = call("GET", "/api/ghats/malikhedi", null);
        assertEquals(200, detail.statusCode());
        assertTrue(detail.body().contains("\"noTable\":true"));
        assertTrue(detail.body().contains("\"status\":\"MISSING\""));
        assertTrue(detail.body().contains("\"status\":\"BELOW_DETECTION\""));

        assertEquals(404, call("GET", "/api/ghats/nowhere", null).statusCode());

        HttpResponse<String> saved = call("PUT", "/api/plan/bairagarh",
                "{\"aeration\":true,\"cleaning\":true,\"extraTesting\":false,\"note\":\"Two aerators from 18 Oct\"}");
        assertEquals(200, saved.statusCode(), saved.body());
        assertTrue(saved.body().contains("\"saved\":true"));

        HttpResponse<String> brief = call("GET", "/api/brief", null);
        assertEquals(200, brief.statusCode());
        assertTrue(brief.body().contains("Planned: aeration, extra cleaning. Note: Two aerators from 18 Oct"));
        // "दुर्गा विसर्जन", escaped so the check does not depend on source-file encoding.
        assertTrue(brief.body().contains("\u0926\u0941\u0930\u094d\u0917\u093e \u0935\u093f\u0938\u0930\u094d\u091c\u0928"));

        HttpResponse<String> csv = call("GET", "/api/ranking.csv", null);
        assertEquals(200, csv.statusCode());
        assertTrue(csv.body().contains("Bairagarh (Sant Hirdaram) kund"));

        assertEquals(204, call("DELETE", "/api/plan/bairagarh", null).statusCode());

        HttpResponse<String> all = call("GET", "/api/readings", null);
        assertEquals(200, all.statusCode());
        assertEquals(1524, all.body().split("\"sourcePage\"").length - 1);

        HttpResponse<String> trend = call("GET", "/api/trend", null);
        assertEquals(200, trend.statusCode());
        assertTrue(trend.body().contains("\"year\":2025"));
        // Bairagarh and Malikhedi have no Durga 2025 table, but Ganesh 2025 was tested, so none untested.
        assertTrue(call("GET", "/api/trend?scope=durga", null).body().contains("\"untested\":2"));

        // Readings typed in after this visarjan feed the ranking, the detail page and the trend.
        HttpResponse<String> entered = call("POST", "/api/field-readings",
                "{\"ghatId\":\"shahpura\",\"year\":2026,\"festival\":\"Durga\",\"phase\":\"during\","
                        + "\"sourceNote\":\"MPPCB lab sheet\",\"values\":{\"Dissolved oxygen\":\"1.2\",\"Lead\":\"BDL\",\"BOD\":\"\"}}");
        assertEquals(200, entered.statusCode(), entered.body());
        assertTrue(entered.body().contains("\"valueAsEntered\":\"1.2\""));
        HttpResponse<String> shahpura = call("GET", "/api/ghats/shahpura", null);
        assertTrue(shahpura.body().contains("Durga 2026"));
        assertTrue(shahpura.body().contains("\"fieldEntry\":true"));
        assertTrue(call("GET", "/api/trend", null).body().contains("\"year\":2026"));
        assertEquals(400, call("POST", "/api/field-readings",
                "{\"ghatId\":\"shahpura\",\"year\":2026,\"festival\":\"Durga\",\"phase\":\"pre\",\"values\":{\"BOD\":\"high\"}}").statusCode());
        HttpResponse<String> clash = call("POST", "/api/field-readings",
                "{\"ghatId\":\"shahpura\",\"year\":2025,\"festival\":\"Durga\",\"phase\":\"pre\",\"values\":{\"BOD\":\"1\"}}");
        assertEquals(400, clash.statusCode());
        assertTrue(clash.body().contains("already in the MPPCB report"));
        HttpResponse<String> list = call("GET", "/api/field-readings", null);
        for (String id : list.body().split("\"id\":")) {
            if (Character.isDigit(id.charAt(0))) {
                assertEquals(204, call("DELETE", "/api/field-readings/" + id.substring(0, id.indexOf(',')), null).statusCode());
            }
        }
        assertEquals("[]", call("GET", "/api/field-readings", null).body());

        // The dev site on port 5173 sends an Origin header; POST must be allowed from it.
        HttpResponse<String> fromDevSite = http.send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/field-readings"))
                .header("Content-Type", "application/json").header("Origin", "http://localhost:5173")
                .POST(HttpRequest.BodyPublishers.ofString("{\"ghatId\":\"shahpura\",\"year\":2026,\"festival\":\"Durga\",\"phase\":\"pre\",\"values\":{}}"))
                .build(), HttpResponse.BodyHandlers.ofString());
        assertEquals(400, fromDevSite.statusCode(), "a CORS rejection would be 403");

        HttpResponse<String> meta = call("GET", "/api/meta", null);
        assertTrue(meta.body().contains("Outdoor bathing (organised)"));

        // When the frontend has been built, the backend serves it, including deep links.
        if (getClass().getResource("/static/index.html") != null) {
            HttpResponse<String> home = call("GET", "/", null);
            assertEquals(200, home.statusCode());
            assertTrue(home.body().contains("id=\"root\""));
            HttpResponse<String> deepLink = call("GET", "/app/ghat/bairagarh", null);
            assertEquals(200, deepLink.statusCode());
            assertTrue(deepLink.body().contains("id=\"root\""));
        }

        HttpResponse<String> pdf = call("GET", "/reports/mppcb-visarjan-2025.pdf", null);
        assertEquals(200, pdf.statusCode());
        assertTrue(pdf.headers().firstValue("Content-Type").orElse("").contains("pdf"));
    }
}
