package com.example.rolls.service;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

/**
 * Сервис для работы с HttpOnly cookies.
 *
 * Использует префиксы для защиты от подмены:
 *  - __Host-  : Secure, Path=/, БЕЗ Domain. Защита от подмены с поддоменов.
 *  - __Secure-: Secure, Domain разрешён. Только для шаренных cookie.
 *
 * Решает проблемы:
 * 1. Установка session ID в безопасную cookie
 * 2. Очистка cookies при logout
 * 3. Настройка флагов безопасности (HttpOnly, Secure, SameSite)
 */
@Service
public class CookieService {

    /**
     * Имя основного session cookie с префиксом __Host-.
     * Должно использоваться ВЕЗДЕ, где читается/пишется/удаляется session cookie.
     */
    public static final String SESSION_COOKIE_NAME = "__Host-session_id";

    @Value("${app.cookie.same-site:Strict}")
    private String sameSite;

    /**
     * Установка cookie с ID сессии.
     *
     * ВАЖНО для __Host-:
     *  - Secure = true (обязательно)
     *  - Path = "/"  (обязательно)
     *  - Domain = НЕ устанавливается (обязательно)
     */
    public void setSessionCookie(HttpServletResponse response, String sessionId, int maxAgeSeconds) {
        ResponseCookie cookie = ResponseCookie.from(SESSION_COOKIE_NAME, sessionId)
                .httpOnly(true)        // JavaScript не может прочитать
                .secure(true)          // __Host- требует Secure=true
                .path("/")             // __Host- требует Path=/
                .maxAge(maxAgeSeconds)
                .sameSite(sameSite)    // защита от CSRF
                // .domain(...)        // НЕЛЬЗЯ для __Host- !
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    /**
     * Очистка session cookie.
     * Атрибуты ДОЛЖНЫ совпадать с setSessionCookie, иначе браузер не удалит cookie.
     */
    public void clearSessionCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(SESSION_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(0)
                .sameSite(sameSite)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    /**
     * Пример __Secure- cookie (для шаренных cookie между поддоменами).
     * Для session cookie НЕ использовать — она должна быть __Host-.
     */
    public void setSecureSharedCookie(HttpServletResponse response,
                                      String name,
                                      String value,
                                      String domain,
                                      int maxAgeSeconds) {
        ResponseCookie cookie = ResponseCookie.from("__Secure-" + name, value)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .domain(domain)        // разрешено для __Secure-
                .maxAge(maxAgeSeconds)
                .sameSite(sameSite)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    /**
     * Очистка всех auth cookies.
     */
    public void clearAuthCookies(HttpServletResponse response) {
        clearSessionCookie(response);
        // сюда добавляйте очистку других cookie, если появятся
    }

    /**
     * Чтение sessionId из cookie запроса.
     * Единая точка чтения — используется и в контроллере, и в SessionService.
     */
    public static String readSessionId(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return null;
        }
        for (var cookie : request.getCookies()) {
            if (SESSION_COOKIE_NAME.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}