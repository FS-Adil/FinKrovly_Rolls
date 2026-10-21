package com.example.rolls.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.concurrent.atomic.AtomicLong;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RollRequestDto {

    private static final AtomicLong ID_GENERATOR = new AtomicLong(1);

    @Builder.Default
    private Long id = ID_GENERATOR.getAndIncrement();

    private String name;

    private String manufacturer;

    private String organization;

    private String batch;

    private BigDecimal pricePerSquareMeter;

    private BigDecimal pricePerTon;

    private BigDecimal areaSquareMeters;

    private BigDecimal weightTons;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate batchDate;

}

