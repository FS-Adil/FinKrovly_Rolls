package com.example.rolls.util;

import org.springframework.data.domain.Page;

public final class MetaFactory {

    private MetaFactory() {}

    public static <T> Meta from(Page<T> page, long durationMs) {
        return Meta.builder()
                .durationMs(durationMs)
                .page(Meta.PageMeta.builder()
                        .current(page.getNumber())
                        .size(page.getSize())
                        .totalElements(page.getTotalElements())
                        .totalPages(page.getTotalPages())
                        .first(page.isFirst())
                        .last(page.isLast())
                        .hasNext(page.hasNext())
                        .hasPrevious(page.hasPrevious())
                        .sort(page.getSort().isSorted() ? page.getSort().toString() : null)
                        .build())
                .build();
    }

    public static Meta ofDuration(long durationMs) {
        return Meta.builder().durationMs(durationMs).build();
    }
}
