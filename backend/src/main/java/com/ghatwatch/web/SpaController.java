package com.ghatwatch.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Sends the React app's page routes to its index.html, so links such as /app/rankings
 * work when the built frontend is served from this backend.
 */
@Controller
public class SpaController {

    @GetMapping({"/app", "/app/**"})
    public String app() {
        return "forward:/index.html";
    }
}
