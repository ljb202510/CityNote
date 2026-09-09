package com.citynote.utils;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

@Component
public class RedisIdWorker {
    /**
     * 开始时间戳
     */
    // 使用LocalDateTime.of(2022-01-01 00:00:00)计算得出
    // 1640995200
    private static final long BEGIN_TIMESTAMP = 1640995200L;
    /**
     * 序列号的位数，不要写死
     */
    private static final int COUNT_BITS = 32;

    private StringRedisTemplate stringRedisTemplate;

    public RedisIdWorker(StringRedisTemplate stringRedisTemplate) {
        this.stringRedisTemplate = stringRedisTemplate;
    }

    public long nextId(String keyPrefix) {
        // 1.生成时间戳
        LocalDateTime now = LocalDateTime.now();
        long nowSecond = now.toEpochSecond(ZoneOffset.UTC);
        long timestamp = nowSecond - BEGIN_TIMESTAMP;

        // 2.生成序列号
        // 2.1.获取当前日期，精确到天，：yyyy:MM:dd格式方便统计Redis自动分层
        String date = now.format(DateTimeFormatter.ofPattern("yyyy:MM:dd"));
        // 2.2.自增长（每一天下的单采用相同的key，自增的上限为2^32-1，避免超过上限）
        long count = stringRedisTemplate.opsForValue().increment("icr:" + keyPrefix + ":" + date);

        // 3.拼接并返回（位运算如果count是0返回0；不使用字符串拼接，否则返回值就是字符串）
        return timestamp << COUNT_BITS | count;
    }
}
