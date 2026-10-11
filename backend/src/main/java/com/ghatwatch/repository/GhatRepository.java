package com.ghatwatch.repository;

import com.ghatwatch.domain.Ghat;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GhatRepository extends JpaRepository<Ghat, String> {
}
