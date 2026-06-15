package com.investedu.platform.repository;

import com.investedu.platform.entity.UserAccountEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAccountRepository extends JpaRepository<UserAccountEntity, Long> {
}
