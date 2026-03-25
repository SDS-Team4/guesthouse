package com.guesthouse.opsapi;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication(scanBasePackages = {
        "com.guesthouse.opsapi",
        "com.guesthouse.shared"
})
@ConfigurationPropertiesScan(basePackages = "com.guesthouse")
@MapperScan(basePackages = {
        "com.guesthouse.opsapi",
        "com.guesthouse.shared.db"
})
public class OpsApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(OpsApiApplication.class, args);
    }
}
