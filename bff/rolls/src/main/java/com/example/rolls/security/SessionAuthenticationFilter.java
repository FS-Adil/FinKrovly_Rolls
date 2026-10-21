package com.example.rolls.security;

import com.example.rolls.service.CookieService;
import com.example.rolls.service.SessionService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;


@Slf4j
@Component
@RequiredArgsConstructor
public class SessionAuthenticationFilter extends OncePerRequestFilter {

    private final SessionService sessionService;
    private final CookieService cookieService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String sessionId = extractSessionId(request);

        if (sessionId != null) {
            log.debug("🔍 Session ID found: {}", sessionId);

            try {
                // Получаем контекст пользователя из сессии
                var userContext = sessionService.getUserContext(sessionId);

                log.debug("✅ Session valid: userId={}, email={}, role={}",
                        userContext.userId(), userContext.email(), userContext.role());

                // Создаем аутентификацию
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userContext.email(),
                                null,
                                List.of(new SimpleGrantedAuthority("ROLE_" + userContext.role()))
                        );

                // Устанавливаем в SecurityContext
                SecurityContextHolder.getContext().setAuthentication(authentication);

                log.debug("🔐 Authentication set: {}", authentication);

            } catch (Exception e) {
                log.error("❌ Session validation failed: {}", e.getMessage());
                SecurityContextHolder.clearContext();
            }
        } else {
            log.warn("⚠️ No session found in request");
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Извлекает sessionId:
     * 1. Cookie (для обычного режима)
     */
//    private String extractSessionId(HttpServletRequest request) {
//        // 🔑 Стратегия 1: Cookie
//        String sessionId = getCookieValue(request, "session_id");
//        if (sessionId != null) {
//            log.info("🔍 Session ID from cookie");
//            return sessionId;
//        }
//
//        return null;
//    }

//    private String getCookieValue(HttpServletRequest request, String cookieName) {
//        Cookie[] cookies = request.getCookies();
//        if (cookies != null) {
//            for (Cookie cookie : cookies) {
//                if (cookieName.equals(cookie.getName())) {
//                    return cookie.getValue();
//                }
//            }
//        }
//        return null;
//    }

    private String extractSessionId(HttpServletRequest request) {
        return cookieService.readSessionId(request);
    }
}
