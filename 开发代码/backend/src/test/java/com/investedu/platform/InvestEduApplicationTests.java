package com.investedu.platform;

import static org.assertj.core.api.Assertions.assertThat;

import com.investedu.platform.repository.AssetRepository;
import com.investedu.platform.repository.TopicRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class InvestEduApplicationTests {
  @Autowired
  private AssetRepository assetRepository;

  @Autowired
  private TopicRepository topicRepository;

  @Test
  void seedsFigmaPrototypeContent() {
    assertThat(assetRepository.count()).isEqualTo(350);
    assertThat(topicRepository.count()).isEqualTo(31);
    assertThat(topicRepository.findById("T031")).isPresent();
  }
}
