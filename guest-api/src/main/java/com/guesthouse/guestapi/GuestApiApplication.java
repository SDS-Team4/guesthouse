package com.guesthouse.guestapi;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication(scanBasePackages = {
        "com.guesthouse.guestapi",
        "com.guesthouse.shared"
})
@ConfigurationPropertiesScan(basePackages = "com.guesthouse")
@MapperScan(basePackages = {
        "com.guesthouse.guestapi",
        "com.guesthouse.shared.db"
})
public class GuestApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(GuestApiApplication.class, args);
    }
}
