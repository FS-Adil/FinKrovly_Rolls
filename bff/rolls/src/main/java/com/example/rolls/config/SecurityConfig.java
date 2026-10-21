package com.example.rolls.config;

import com.example.rolls.security.SessionAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.session.NullAuthenticatedSessionStrategy;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final SessionAuthenticationFilter sessionAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // ==================== CORS ====================
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

//                .addFilterBefore(rateLimitingFilter, UsernamePasswordAuthenticationFilter.class)
//                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)

                .csrf(csrf -> csrf
                        .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                        .csrfTokenRequestHandler(new SpaCsrfTokenRequestHandler())
                        // только login (и register, если нужно) без CSRF; logout — с CSRF
                        .ignoringRequestMatchers("/api/auth/login", "/api/auth/register")
                )

                .addFilterAfter(new CsrfCookieFilter(), BasicAuthenticationFilter.class)

                .addFilterBefore(sessionAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)

                // Сессии создаются по требованию (логин), хранятся в Redis
                .sessionManagement(sm -> sm
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                        .sessionAuthenticationStrategy(new NullAuthenticatedSessionStrategy())
                )

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(
                                "/api/auth/login",
                                "/api/auth/me",

                                "/swagger-ui.html",
                                "/swagger-ui/**",
                                "/v3/api-docs",
                                "/v3/api-docs/**",
                                "/v3/api-docs.yaml",
                                "/swagger-resources/**",
                                "/webjars/**",
                                "/error"
                        ).permitAll()
                        .requestMatchers("/api/admin/**",
                                "/api/auth/register").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )

                .exceptionHandling(eh -> eh
                        .authenticationEntryPoint((req, res, ex) -> {
                            res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            res.setContentType("application/json;charset=UTF-8");
                            res.getWriter().write(
                                    "{\"error\":\"Unauthorized\",\"message\":\"Требуется аутентификация\"}");
                        })
                )

                // ==================== ОТКЛЮЧАЕМ НЕИСПОЛЬЗУЕМОЕ ====================
                .formLogin(AbstractHttpConfigurer::disable)   // Нет формы логина
                .httpBasic(AbstractHttpConfigurer::disable)   // Нет Basic Auth
                .logout(AbstractHttpConfigurer::disable)      // Логаут через API
                .rememberMe(AbstractHttpConfigurer::disable)  // Нет remember me


                .headers(headers -> headers
                        .frameOptions(frame -> frame.deny())
                        .contentSecurityPolicy(csp -> csp.policyDirectives(
                                "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"))
                );

        return http.build();
    }

    /**
     * Конфигурация CORS.
     * Разрешает запросы только с доверенных доменов.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Разрешенные источники (в production - конкретные домены)
        configuration.setAllowedOrigins(List.of(
                "http://localhost:4000", "https://pwa.rolls.finkrovl.ru", "http://localhost:4173")
        );

        // Разрешенные HTTP методы
        configuration.setAllowedMethods(Arrays.asList(
                "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"
        ));

//        configuration.setAllowedHeaders(Arrays.asList("*"));

        configuration.setAllowedHeaders(Arrays.asList(
                "Content-Type",
                "X-XSRF-TOKEN",
                "Authorization",
                "Accept",
                "Origin",
                "X-Requested-With"
        ));

        // Разрешить отправку кук
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}
