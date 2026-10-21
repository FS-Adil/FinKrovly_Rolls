package com.example.rolls.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Форсирует загрузку CsrfToken на каждом запросе, чтобы CookieCsrfTokenRepository
 * записал cookie XSRF-TOKEN в ответ. Без этого фильтра при SessionCreationPolicy.STATELESS
 * токен остаётся deferred и saveToken(null) стирает cookie.
 */
public class CsrfCookieFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {
        CsrfToken csrfToken = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
        if (csrfToken != null) {
            // обращение к getToken() триггерит генерацию и последующее сохранение
            csrfToken.getToken();
        }
        filterChain.doFilter(request, response);
    }
}