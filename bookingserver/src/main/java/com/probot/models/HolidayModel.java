package com.probot.models;

import com.fasterxml.jackson.annotation.JsonFormat;
import org.springframework.format.annotation.DateTimeFormat;

import java.util.Date;

/**
 * Created by abhisheks on 19-Sep-17.
 */
public class HolidayModel {
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    Date startDate;
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    Date endDate;

    public Date getStartDate() {
        return startDate;
    }

    public void setStartDate(Date startDate) {
        this.startDate = startDate;
    }

    public Date getEndDate() {
        return endDate;
    }

    public void setEndDate(Date endDate) {
        this.endDate = endDate;
    }
}
