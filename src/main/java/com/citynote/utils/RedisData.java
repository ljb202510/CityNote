package com.citynote.utils;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class RedisData {
    private LocalDateTime expireTime;
    private Object data;
    // 为了避免修改原有shop类的业务逻辑，专门设计一个类包含过期时间和shop对象
}
