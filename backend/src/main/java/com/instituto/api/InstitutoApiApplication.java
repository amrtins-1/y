package com.instituto.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class InstitutoApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(InstitutoApiApplication.class, args);
    }
}
