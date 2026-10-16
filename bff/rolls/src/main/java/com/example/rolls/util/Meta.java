package com.example.rolls.util;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

/**
 * Метаданные ответа — пагинация, сортировка, время выполнения.
 * Фронт использует их для построения пагинатора, скелетонов и т.д.
 */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Meta {

    private final PageMeta page;
    private final Long durationMs;

    @Getter
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class PageMeta {
        private final int current;        // текущая страница (0-based, как в Spring)
        private final int size;           // размер страницы
        private final long totalElements; // всего записей
        private final int totalPages;     // всего страниц
        private final boolean first;
        private final boolean last;
        private final boolean hasNext;
        private final boolean hasPrevious;
        private final String sort;        // например "createdAt,desc"
    }
}
