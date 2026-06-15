package com.investedu.platform.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "topic_asset")
public class TopicAssetEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "topic_id", nullable = false)
  private TopicEntity topic;

  @Column(nullable = false, length = 64)
  private String assetId;

  @Column(nullable = false)
  private int assetOrder;

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public TopicEntity getTopic() {
    return topic;
  }

  public void setTopic(TopicEntity topic) {
    this.topic = topic;
  }

  public String getAssetId() {
    return assetId;
  }

  public void setAssetId(String assetId) {
    this.assetId = assetId;
  }

  public int getAssetOrder() {
    return assetOrder;
  }

  public void setAssetOrder(int assetOrder) {
    this.assetOrder = assetOrder;
  }
}
