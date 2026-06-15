package com.investedu.platform.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "topic")
public class TopicEntity {
  @Id
  @Column(length = 64)
  private String id;

  @Column(nullable = false, length = 200)
  private String name;

  @Column(nullable = false, length = 32)
  private String channel;

  @Column(length = 32)
  private String scene;

  @Column(length = 300)
  private String audience;

  @Column(length = 1000)
  private String goal;

  @Column(length = 500)
  private String tagline;

  private LocalDate updated;

  @Column(length = 500)
  private String url;

  @Column(length = 1200)
  private String combineReason;

  @Column(length = 32)
  private String sendMode;

  @Column(length = 300)
  private String sendOrder;

  @Column(length = 500)
  private String talkBoundary;

  @Column(length = 64)
  private String coverId;

  @Column(length = 80)
  private String sceneGroup;

  private long downloads;

  @OneToMany(mappedBy = "topic", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
  @OrderBy("assetOrder ASC")
  private List<TopicAssetEntity> assets = new ArrayList<>();

  public void replaceAssetIds(List<String> assetIds) {
    assets.clear();
    if (assetIds == null) {
      return;
    }
    for (int i = 0; i < assetIds.size(); i++) {
      TopicAssetEntity item = new TopicAssetEntity();
      item.setTopic(this);
      item.setAssetId(assetIds.get(i));
      item.setAssetOrder(i);
      assets.add(item);
    }
  }

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getChannel() {
    return channel;
  }

  public void setChannel(String channel) {
    this.channel = channel;
  }

  public String getScene() {
    return scene;
  }

  public void setScene(String scene) {
    this.scene = scene;
  }

  public String getAudience() {
    return audience;
  }

  public void setAudience(String audience) {
    this.audience = audience;
  }

  public String getGoal() {
    return goal;
  }

  public void setGoal(String goal) {
    this.goal = goal;
  }

  public String getTagline() {
    return tagline;
  }

  public void setTagline(String tagline) {
    this.tagline = tagline;
  }

  public LocalDate getUpdated() {
    return updated;
  }

  public void setUpdated(LocalDate updated) {
    this.updated = updated;
  }

  public String getUrl() {
    return url;
  }

  public void setUrl(String url) {
    this.url = url;
  }

  public String getCombineReason() {
    return combineReason;
  }

  public void setCombineReason(String combineReason) {
    this.combineReason = combineReason;
  }

  public String getSendMode() {
    return sendMode;
  }

  public void setSendMode(String sendMode) {
    this.sendMode = sendMode;
  }

  public String getSendOrder() {
    return sendOrder;
  }

  public void setSendOrder(String sendOrder) {
    this.sendOrder = sendOrder;
  }

  public String getTalkBoundary() {
    return talkBoundary;
  }

  public void setTalkBoundary(String talkBoundary) {
    this.talkBoundary = talkBoundary;
  }

  public String getCoverId() {
    return coverId;
  }

  public void setCoverId(String coverId) {
    this.coverId = coverId;
  }

  public String getSceneGroup() {
    return sceneGroup;
  }

  public void setSceneGroup(String sceneGroup) {
    this.sceneGroup = sceneGroup;
  }

  public long getDownloads() {
    return downloads;
  }

  public void setDownloads(long downloads) {
    this.downloads = downloads;
  }

  public List<TopicAssetEntity> getAssets() {
    return assets;
  }

  public void setAssets(List<TopicAssetEntity> assets) {
    this.assets = assets;
  }
}
