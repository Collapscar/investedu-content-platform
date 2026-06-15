package com.investedu.platform.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "asset")
public class AssetEntity {
  @Id
  @Column(length = 64)
  private String id;

  @Column(nullable = false, length = 200)
  private String title;

  @Column(nullable = false, length = 32)
  private String cat;

  @Column(length = 500)
  private String question;

  @Column(length = 1000)
  private String summary;

  @Column(length = 1200)
  private String risk;

  @Column(length = 500)
  private String cover;

  @Column(length = 32)
  private String scene;

  private LocalDate updated;

  @Column(length = 300)
  private String audience;

  @Column(length = 500)
  private String useWhen;

  @Column(length = 500)
  private String talkTip;

  private long downloads;

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getCat() {
    return cat;
  }

  public void setCat(String cat) {
    this.cat = cat;
  }

  public String getQuestion() {
    return question;
  }

  public void setQuestion(String question) {
    this.question = question;
  }

  public String getSummary() {
    return summary;
  }

  public void setSummary(String summary) {
    this.summary = summary;
  }

  public String getRisk() {
    return risk;
  }

  public void setRisk(String risk) {
    this.risk = risk;
  }

  public String getCover() {
    return cover;
  }

  public void setCover(String cover) {
    this.cover = cover;
  }

  public String getScene() {
    return scene;
  }

  public void setScene(String scene) {
    this.scene = scene;
  }

  public LocalDate getUpdated() {
    return updated;
  }

  public void setUpdated(LocalDate updated) {
    this.updated = updated;
  }

  public String getAudience() {
    return audience;
  }

  public void setAudience(String audience) {
    this.audience = audience;
  }

  public String getUseWhen() {
    return useWhen;
  }

  public void setUseWhen(String useWhen) {
    this.useWhen = useWhen;
  }

  public String getTalkTip() {
    return talkTip;
  }

  public void setTalkTip(String talkTip) {
    this.talkTip = talkTip;
  }

  public long getDownloads() {
    return downloads;
  }

  public void setDownloads(long downloads) {
    this.downloads = downloads;
  }
}
