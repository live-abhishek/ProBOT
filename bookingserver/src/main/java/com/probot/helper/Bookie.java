package com.probot.helper;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.gargoylesoftware.htmlunit.BrowserVersion;
import com.gargoylesoftware.htmlunit.DefaultCredentialsProvider;
import com.gargoylesoftware.htmlunit.WebClient;
import com.gargoylesoftware.htmlunit.html.DomNode;
import com.gargoylesoftware.htmlunit.html.DomNodeList;
import com.gargoylesoftware.htmlunit.html.HtmlButton;
import com.gargoylesoftware.htmlunit.html.HtmlForm;
import com.gargoylesoftware.htmlunit.html.HtmlInput;
import com.gargoylesoftware.htmlunit.html.HtmlLink;
import com.gargoylesoftware.htmlunit.html.HtmlOption;
import com.gargoylesoftware.htmlunit.html.HtmlPage;
import com.gargoylesoftware.htmlunit.html.HtmlSelect;
import com.gargoylesoftware.htmlunit.html.HtmlTable;
import com.gargoylesoftware.htmlunit.html.HtmlTableCell;
import com.gargoylesoftware.htmlunit.html.HtmlTableRow;
import com.probot.entities.Meeting;
import com.probot.entities.User;
import com.probot.helper.PasswordCoder;

/**
 * @author Vedang, Created on Sep 17, 2017
 *
 */
@Component
public class Bookie {

	private static final String WEBSITE = "apps.prorigo.com";
	private static final String BOOKING = "/conference/Booking";
	private static final String SHOW_MY_BOOKINGS = "/conference//Home/MyBooking";

	@Autowired
	PasswordCoder passwordCoder;

	public void roomBooking(User user, Meeting meeting) throws Exception {

		try (final WebClient webClient = new WebClient(
				BrowserVersion.FIREFOX_52)) {

			// set proxy username and password
			DefaultCredentialsProvider credentialsProvider = (DefaultCredentialsProvider) webClient
					.getCredentialsProvider();
			credentialsProvider.addNTLMCredentials(user.getUsername(),
					passwordCoder.decrypt(user.getPassword()), WEBSITE, 80, "",
					"");

			String pageUrl = new StringBuilder("http://").append(WEBSITE)
					.append(BOOKING).toString();
			HtmlPage page = webClient.getPage(pageUrl);

			HtmlForm form = page.getForms().get(0);
			HtmlButton button = form.getFirstByXPath("//*[@id=\"Submit\"]");

			HtmlSelect select = (HtmlSelect) page
					.getElementById("ConferenceRooms");
			HtmlOption option = select.getOptionByValue(meeting.getRoom());
			select.setSelectedAttribute(option, true);

			String meetingTime = getTimeFormDate(meeting.getStartTime());
			HtmlInput inputStartTime = form.getInputByName("StartTime");
			inputStartTime.setValueAttribute(meetingTime);

			meetingTime = getTimeFormDate(meeting.getEndTime());
			HtmlInput inputEndTime = form.getInputByName("EndTime");
			inputEndTime.setValueAttribute(meetingTime);

			HtmlInput inputReason = form.getInputByName("Title");
			inputReason.type("Test Booking By HtmlUnit");

			button.click();
		}
	}

	private String getTimeFormDate(Date date) {
		Calendar instance = Calendar.getInstance();
		instance.setTime(date);
		int hour = instance.get(Calendar.HOUR_OF_DAY);
		int min = instance.get(Calendar.MINUTE);
		String median = " AM";
		if (hour > 12) {
			hour = hour % 12;
			median = " PM";
		}
		String meetingTime = hour + ":" + min + median;
		return meetingTime;
	}

	public List showMyBookings(User user) throws Exception {
		List<String> bookings = new ArrayList<String>();
		try (final WebClient webClient = new WebClient(
				BrowserVersion.FIREFOX_52)) {

			// set proxy username and password
			DefaultCredentialsProvider credentialsProvider = (DefaultCredentialsProvider) webClient
					.getCredentialsProvider();
			credentialsProvider.addNTLMCredentials(user.getUsername(),
					passwordCoder.decrypt(user.getPassword()), WEBSITE, 80, "",
					"");
			String pageUrl = new StringBuilder("http://").append(WEBSITE)
					.append(SHOW_MY_BOOKINGS).toString();
			HtmlPage page = webClient.getPage(pageUrl);
			HtmlTable table = (HtmlTable) page.getByXPath(
					".//*[@id='Grid']/table").get(0);
			List<HtmlTableRow> rows = table.getRows();
			for (HtmlTableRow htmlTableRow : rows) {
				for (HtmlTableCell cell : htmlTableRow.getCells()) {
					if (cell.getElementsByTagName("a").getLength() != 0) {
						String url = cell.getElementsByTagName("a").get(0)
								.getAttribute("href").toString();
						String id = getMeetingUniqueId(url);
						bookings.add(id);
					}
					bookings.add(cell.getTextContent());
				}
			}
		}
		System.out.println("My Bookings" + bookings);
		return bookings;
	}

	private String getMeetingUniqueId(String url) throws URISyntaxException {
		URI uri = new URI(url);
		String[] segments = uri.getPath().split("/");
		String idStr = segments[segments.length - 1];
		return idStr;
	}

	public static void main(String[] args) {
		Bookie bookie = new Bookie();
		try {
			bookie.showMyBookings(null);
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
}
