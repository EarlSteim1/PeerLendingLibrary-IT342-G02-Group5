package edu.cit.peerreads.backend.config;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

/**
 * One-time database fix to alter image_url column to MEDIUMTEXT
 * This will run once on application startup
 */
@Slf4j
@Component
@Order(1)
public class DatabaseFix implements CommandLineRunner {

    @Value("${spring.datasource.url}")
    private String datasourceUrl;

    @Value("${spring.datasource.username}")
    private String datasourceUsername;

    @Value("${spring.datasource.password}")
    private String datasourcePassword;

    @Override
    public void run(String... args) {
        try {
            // Extract database name from URL
            String dbUrl = datasourceUrl;
            if (dbUrl.contains("?")) {
                dbUrl = dbUrl.substring(0, dbUrl.indexOf("?"));
            }
            
            // Connect to MySQL
            Connection conn = DriverManager.getConnection(dbUrl, datasourceUsername, datasourcePassword);
            Statement stmt = conn.createStatement();
            
            // Try to alter the column
            try {
                stmt.executeUpdate("ALTER TABLE books MODIFY COLUMN image_url MEDIUMTEXT");
                log.info("Successfully altered image_url column to MEDIUMTEXT");
            } catch (Exception e) {
                // Column might already be MEDIUMTEXT or error occurred
                log.debug("Could not alter image_url column (might already be correct): {}", e.getMessage());
            }
            
            stmt.close();
            conn.close();
        } catch (Exception e) {
            log.warn("Could not fix database column automatically. Please run manually: ALTER TABLE books MODIFY COLUMN image_url MEDIUMTEXT;");
            log.debug("Error: {}", e.getMessage());
        }
    }
}


